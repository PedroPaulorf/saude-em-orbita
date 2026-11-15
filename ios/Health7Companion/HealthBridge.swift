import Foundation
import HealthKit
import Combine
import CryptoKit

/// Prototype: foreground-only sync, ephemeral cookie session, no stored password.
@MainActor
final class HealthBridge: ObservableObject {
    @Published private(set) var owner: String?
    @Published private(set) var name = ""
    @Published private(set) var busy = false
    @Published private(set) var authorized = false
    @Published var automatic = false
    @Published private(set) var status = "Sign in to the same account as the Health7 website."
    @Published private(set) var lastSync: Date?
    var isActive = true
    private let health = HKHealthStore()
    private var session = URLSession(configuration: .ephemeral)
    private var base: URL?
    private var generation = UUID()
    // Bounded, in-memory batch retained unchanged on ambiguous network failure.
    private var pending: Data?
    private let mappings: [(HKQuantityTypeIdentifier, String, HKUnit, String, Double)] = [
        (.heartRate, "heartRate", HKUnit.count().unitDivided(by: .minute()), "bpm", 1),
        (.restingHeartRate, "restingHeartRate", HKUnit.count().unitDivided(by: .minute()), "bpm", 1),
        (.oxygenSaturation, "spo2", .percent(), "%", 100),
        (.respiratoryRate, "respiratoryRate", HKUnit.count().unitDivided(by: .minute()), "breaths/min", 1),
        (.bodyMass, "bodyMass", .gramUnit(with: .kilo), "kg", 1),
    ]
    struct Sample: Codable {
        let device: String
        let metric: String
        let value: Double
        let unit: String
        let at: String
    }
    struct Batch: Encodable {
        let clientId: String
        let version = 1
        let source = "apple"
        let format = "health7-json-v1"
        let quality = "unverified"
        let samples: [Sample]
    }
    struct Profile: Decodable { let id: String; let displayName: String }
    struct Login: Decodable { let profile: Profile }
    struct Receipt: Decodable { let crewId: String; let clientId: String; let added: Int; let duplicates: Int }
    struct BridgeError: LocalizedError {
        let text: String
        var errorDescription: String? { text }
    }
    func signIn(server: String, username: String, password: String) async {
        guard !busy, owner == nil else { return }
        guard let url = URL(string: server.trimmingCharacters(in: .whitespacesAndNewlines)),
              let scheme = url.scheme, ["http", "https"].contains(scheme), url.host != nil,
              url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
              url.path.isEmpty || url.path == "/" else {
            status = "Enter the server origin, including http:// or https://, without a path."; return
        }
        // HTTP is explicitly for isolated local testing; never send real credentials over HTTP.
        let octets = (url.host ?? "").split(separator: ".").compactMap { Int($0) }
        let localIPv4 = octets.count == 4 && octets.allSatisfy { (0...255).contains($0) }
            && ((octets[0] == 192 && octets[1] == 168) || octets[0] == 10)
        if scheme == "http" && !(localIPv4 || url.host?.hasSuffix(".local") == true) {
            status = "Use HTTPS, or a local 192.168.x.x / 10.x.x / .local server for demo data."; return
        }
        disconnect()
        base = url
        let stamp = generation
        busy = true; defer { if stamp == generation { busy = false } }
        do {
            let body = try JSONSerialization.data(withJSONObject: ["username": username, "password": password])
            let data = try await request("/auth/login", body: body)
            guard stamp == generation else { return }
            let result = try JSONDecoder().decode(Login.self, from: data)
            owner = result.profile.id; name = result.profile.displayName
            status = "Signed in. Authorize Apple Health to start reading."
        } catch { if stamp == generation { status = error.localizedDescription } }
    }
    func authorizeAndSync() async {
        guard !busy, owner != nil else { return }
        guard HKHealthStore.isHealthDataAvailable() else { status = "Health data is unavailable on this device."; return }
        let stamp = generation
        busy = true
        do {
            let types = Set<HKObjectType>(mappings.compactMap { HKObjectType.quantityType(forIdentifier: $0.0) })
            try await health.requestAuthorization(toShare: [], read: types)
            guard stamp == generation else { return }
            // Completion means the permission sheet finished, not that every read was granted.
            authorized = true; busy = false
            await sync()
        } catch { if stamp == generation { busy = false; status = error.localizedDescription } }
    }
    func sync() async {
        guard !busy, let account = owner, authorized else { return }
        guard isActive else { status = "Sync paused while the app is inactive."; return }
        let stamp = generation
        busy = true; defer { if stamp == generation { busy = false } }
        do {
            if pending == nil {
                let samples = try await readSamples()
                guard stamp == generation else { return }
                guard !samples.isEmpty else {
                    status = "No readable measurements in the last 7 days. Check Health permissions and available data; no zeros were sent."; return
                }
                let encoder = JSONEncoder(); encoder.outputFormatting = [.sortedKeys]
                let digest = SHA256.hash(data: try encoder.encode(samples)).map { String(format: "%02x", $0) }.joined()
                pending = try encoder.encode(Batch(clientId: "healthkit-" + digest, samples: samples))
            }
            guard stamp == generation, let payload = pending else { return }
            guard isActive else { status = "Sync paused. Pending measurements can be retried when the app is active."; return }
            let data = try await request("/me/wearables/imports", body: payload)
            guard stamp == generation else { return }
            let receipt = try JSONDecoder().decode(Receipt.self, from: data)
            let sent = try JSONSerialization.jsonObject(with: payload) as? [String: Any]
            guard receipt.crewId == account, receipt.clientId == sent?["clientId"] as? String else {
                throw BridgeError(text: "Unexpected confirmation. Disconnect and verify the server and account.")
            }
            pending = nil; lastSync = Date()
            status = "Server confirmed \(receipt.added) added, \(receipt.duplicates) duplicates. Refresh imported history on the website."
        } catch {
            if stamp == generation { status = error.localizedDescription + " No success was recorded. Retry uses the same batch while this session stays open." }
        }
    }
    private func readSamples() async throws -> [Sample] {
        let now = Date(), start = Date().addingTimeInterval(-7 * 86400)
        let predicate = HKQuery.predicateForSamples(withStart: start, end: now, options: .strictStartDate)
        let formatter = ISO8601DateFormatter(); formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        var result: [Sample] = []
        for (identifier, metric, unit, wireUnit, factor) in mappings {
            guard isActive else { throw BridgeError(text: "Sync paused while the app is inactive.") }
            guard let type = HKObjectType.quantityType(forIdentifier: identifier) else { continue }
            // At most 100 newest records per metric, 500 per batch; no claim of complete history.
            let records: [HKQuantitySample] = try await withCheckedThrowingContinuation { continuation in
                let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: 100,
                    sortDescriptors: [NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)]) { _, samples, error in
                    if let error { continuation.resume(throwing: error) }
                    else { continuation.resume(returning: samples as? [HKQuantitySample] ?? []) }
                }
                health.execute(query)
            }
            for sample in records {
                let value = sample.quantity.doubleValue(for: unit) * factor
                guard value.isFinite else { continue }
                // Retain sample identity in provenance so equal readings from different samples are distinct.
                let source = String(sample.sourceRevision.source.name.prefix(90))
                result.append(Sample(device: "\(source) · HK \(sample.uuid.uuidString)", metric: metric, value: value, unit: wireUnit, at: formatter.string(from: sample.startDate)))
            }
        }
        return result.sorted { ($0.metric, $0.at, $0.device) < ($1.metric, $1.at, $1.device) }
    }
    private func request(_ path: String, body: Data) async throws -> Data {
        guard let base else { throw BridgeError(text: "No server configured.") }
        let endpoint = base.appendingPathComponent("api/v1" + path)
        var request = URLRequest(url: endpoint); request.httpMethod = "POST"; request.httpBody = body; request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Health7", forHTTPHeaderField: "X-Requested-With")
        if let owner { request.setValue(owner, forHTTPHeaderField: "X-Health7-Crew") }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw BridgeError(text: "Invalid server response.") }
        guard (200..<300).contains(http.statusCode) else {
            if http.statusCode == 401 { automatic = false }
            throw BridgeError(text: http.statusCode == 401 ? "Sign-in failed or session expired. Disconnect and sign in again." : "Server rejected the request (\(http.statusCode)). Check the server and retry.")
        }
        return data
    }
    func disconnect() {
        // Local cookie store is ephemeral. Revoke the old server session best-effort.
        if owner != nil, let base {
            var request = URLRequest(url: base.appendingPathComponent("api/v1/auth/logout"))
            request.httpMethod = "POST"; request.setValue("Health7", forHTTPHeaderField: "X-Requested-With")
            let cookies = session.configuration.httpCookieStorage?.cookies(for: request.url!) ?? []
            request.allHTTPHeaderFields = (request.allHTTPHeaderFields ?? [:]).merging(HTTPCookie.requestHeaderFields(with: cookies)) { _, new in new }
            let revoker = URLSession(configuration: .ephemeral)
            revoker.dataTask(with: request) { _, _, _ in revoker.finishTasksAndInvalidate() }.resume()
        }
        generation = UUID(); automatic = false; authorized = false; pending = nil; lastSync = nil
        session.invalidateAndCancel(); session = URLSession(configuration: .ephemeral)
        base = nil; owner = nil; name = ""; busy = false; status = "Disconnected. No new uploads."
    }
}
