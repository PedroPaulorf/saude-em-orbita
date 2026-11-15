import SwiftUI

struct ContentView: View {
    @StateObject private var bridge = HealthBridge()
    @Environment(\.scenePhase) private var phase
    @State private var server = ""
    @State private var username = ""
    @State private var password = ""
    @State private var consent = false
    private let timer = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            Form {
                Section("Health7 server") {
                    TextField("https://server or local Wi-Fi address", text: $server)
                        .textInputAutocapitalization(.never).autocorrectionDisabled().keyboardType(.URL)
                    TextField("Username", text: $username).textInputAutocapitalization(.never).autocorrectionDisabled()
                    SecureField("Password", text: $password)
                    if bridge.owner == nil {
                        Button("Sign in") {
                            Task { await bridge.signIn(server: server, username: username, password: password); password = "" }
                        }.disabled(bridge.busy)
                    } else {
                        Text("Signed in: \(bridge.name)")
                    }
                }.disabled(bridge.owner != nil && !bridge.busy)
                if bridge.owner != nil {
                    Section("Apple Health") {
                        Text("Read the latest 7 days: heart rate, resting heart rate, oxygen saturation, respiratory rate and body mass. No health data is written to Apple Health.")
                        Toggle("I authorize sending these measurements to this Health7 server and account", isOn: $consent)
                            .disabled(bridge.busy || bridge.automatic)
                        Button("Authorize Health & sync now") { Task { await bridge.authorizeAndSync() } }
                            .disabled(!consent || bridge.busy)
                        Toggle("Automatic sync while this app is open", isOn: $bridge.automatic)
                            .disabled(!consent || !bridge.authorized || bridge.busy)
                        Button("Sync now / retry") { Task { await bridge.sync() } }
                            .disabled(!consent || !bridge.authorized || bridge.busy)
                        Text("Sync pauses when this app is inactive. Health read permission may be denied or partial without the app being able to distinguish that from missing data.")
                            .font(.footnote)
                    }
                    Section {
                        Button("Disconnect", role: .destructive) {
                            bridge.disconnect(); consent = false; password = ""
                        }
                        Text("Disconnect stops uploads and clears the in-memory session. Revoke Health permissions in Settings. Saved server records are retained.").font(.footnote)
                    }
                }
                Section("Status") {
                    if bridge.busy { ProgressView() }
                    Text(bridge.status).accessibilityIdentifier("sync-status")
                    if let last = bridge.lastSync { Text("Last confirmed sync: \(last.formatted())") }
                }
            }.navigationTitle("Health7 · iPhone")
        }
        .onAppear { bridge.isActive = phase == .active }
        .onReceive(timer) { _ in
            if phase == .active && bridge.automatic && consent { Task { await bridge.sync() } }
        }
        .onChange(of: phase) { _, next in
            bridge.isActive = next == .active
            if next == .active && bridge.automatic && consent { Task { await bridge.sync() } }
        }
    }
}
