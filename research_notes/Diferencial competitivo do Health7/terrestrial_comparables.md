# Terrestrial health monitoring comparables vs. Health7 (astronaut daily check-in)

Scope: consumer wearables/apps, remote patient monitoring (RPM)/telemonitoring, tools for isolated/confined/extreme (ICE) environments, self-report mood check-ins, and common criticisms. Benchmark = Health7: offline-first web app, no special hardware, no server; daily check-up compared to the user's PERSONAL baseline; alert rules written on screen and labeled "Demonstration rule"; separate behavioral self-report check-in plus a short reaction test; clickable body figure linked to NASA spaceflight risks; live NASA DONKI space weather; "Report for ground" queued for downlink when offline. It informs and refers; it does not diagnose.

Research date: 2026-11-14. About 19 search/fetch calls. Pricing data partly comes from third-party aggregators and is marked as such.

---

## 1. Consumer wearables (Oura, WHOOP, Apple, Garmin, Fitbit/Google): personal baselines, transparency, offline use, clinician layer, self-report, cost

### Takeaway
All five major ecosystems already compare users with their own personal baseline (WHOOP 30-day HRV baseline, Garmin about a 3-week HRV range, Apple a 7-night "typical range", Fitbit 7-day/1-month trends, Oura personal baselines). Personal baselines are therefore standard practice, not a Health7 innovation. Where Health7 differs is transparency. A 2025 review of 14 composite scores from 10 makers found that none disclosed its exact formula or weightings and few had peer-reviewed validation. All of these products also need dedicated hardware, and most need a phone/cloud ecosystem and often a subscription.

### Cited Findings
**Personal baselines**
- WHOOP Recovery: "WHOOP compares your current HRV to your 30-day baseline"; higher-than-usual HRV raises Recovery. Inputs: HRV, resting HR, respiratory rate, sleep vs. need, sleep stages, skin temperature, SpO2, menstrual phase. Zones: green ≥67%, yellow 34–66%, red ≤33% — [WHOOP Support: WHOOP Recovery](https://support.whoop.com/s/article/WHOOP-Recovery)
- WHOOP says the first four days are used for calibration, and that "raw HRV values are weak comparison tools" (so values are read against the baseline) — [WHOOP The Locker podcast 40](https://www.whoop.com/us/en/thelocker/podcast-40-whoop-recovery-maximize-readiness/)
- WHOOP also publishes member population averages (e.g., HRV 65 ms men / 62 ms women; average recovery 58%). It uses population data for context while scoring against the personal baseline — [WHOOP Member Averages](https://www.whoop.com/us/en/thelocker/member-averages-recovery-strain-sleep-hrv/)
- Garmin HRV Status: "Your HRV baseline is a range of values (e.g., 33-45 milliseconds) derived from your measurement history that represent a normal degree of variability for you personally." "Balanced" means the 7-day average is inside the personal range and "Unbalanced" means outside. The baseline "is dynamic and changes slowly over time." A hybrid rule applies: if the personal baseline drops below **age-based standards**, the status becomes "Poor" — [Garmin: HRV Status](https://www.garmin.com/en-US/garmin-technology/health-science/hrv-status/)
- Garmin's baseline typically takes about 3 weeks (21 nights) of consistent overnight data — [Garmin blog: What is HRV](https://www.garmin.com/en-SG/blog/general/heart-rate-variability-hrv/)
- A user forum thread questions whether Garmin Body Battery is normalized to population HRV rather than the personal baseline (user speculation, not confirmed by Garmin) — [Garmin Forums](https://forums.garmin.com/sports-fitness/healthandwellness/f/vivoactive-6-series/442273/body-battery-capped-at-50-for-4-weeks-despite-balanced-hrv-status-is-the-bb-scale-normalized-to-population-hrv-rather-than-personal-baseline)
- Apple Watch Vitals app: it tracks overnight heart rate, respiratory rate, blood oxygen, wrist temperature and sleep duration (HRV replaces sleep duration on Series 12 / Ultra 4, which also get a daytime view with resting HR and HRV). Users must wear the watch to sleep for **7 days to establish a typical range**. "If multiple metrics are outside of your typical range, you get a notification the next morning which tells you possible factors." Disclaimer: "Vitals app measurements are not intended for medical use." It requires an iPhone and an Apple Watch on the latest OS — [Apple Support 120142](https://support.apple.com/en-us/120142)
- Oura Readiness (0–100) contributors: Sleep, Sleep Balance, Sleep Regularity, Previous Day Activity, Activity Balance, Resting HR, HRV Balance, Body Temperature, Recovery Index — [Oura blog: Readiness Score](https://ouraring.com/blog/readiness-score/). Oura tracks temperature as nightly deviation from personal baseline, not absolute temperature (secondary source) — [Plotline Health](https://www.plotline.health/blog/oura-ring-readiness-score-explained)
- Google Health app (Fitbit) readiness bands, e.g., "Moderate Readiness (30–64)" — [Google Health Help](https://support.google.com/googlehealth/answer/14236710?hl=en). Fitbit Daily Readiness uses 7-day and 1-month trends/baselines — [Doherty et al. 2025](https://www.degruyterbrill.com/document/doi/10.1515/teb-2025-0001/html)
- Baseline windows across makers (from Doherty 2025): Polar Nightly Recharge 28-day dynamic baseline; WHOOP Stress Monitor 14-day baseline; Garmin Training Readiness, Oura and Ultrahuman use personal baselines that adjust over time — [Doherty et al. 2025, Translational Exercise Biomedicine](https://www.degruyterbrill.com/document/doi/10.1515/teb-2025-0001/html)

**Transparency of scores**
- Review of 14 composite health scores (CHS) from 10 manufacturers (Fitbit, Garmin, Oura, WHOOP, Polar, Samsung, Suunto, Ultrahuman, Coros, Withings): "None of the manufacturers disclosed their exact algorithmic formulas, and few provided empirical validation or peer-reviewed evidence supporting the accuracy or clinical relevance of their scores." The authors found "significant discrepancies... in data collection timeframes, metric weighting, and proprietary scoring methodologies." Most common inputs: HRV 86%, RHR 79%, activity 71%, sleep duration 71%. The authors call for "algorithmic transparency" so that scores are not "opaque consumer tools" — [Doherty, Baldwin, Lambe, Burke, Altini 2025](https://www.degruyterbrill.com/document/doi/10.1515/teb-2025-0001/html)
- WHOOP's support page lists the inputs and their general direction of effect but does not disclose formulas or weights (based on the page content) — [WHOOP Support](https://support.whoop.com/s/article/WHOOP-Recovery)
- Consumer wearables "package [similar physiology] into different, non-equivalent proprietary scores, making direct comparison difficult" — [Applied Clinical Trials](https://www.appliedclinicaltrialsonline.com/view/validity-reliability-regulatory-considerations-consumer-devices-clinical-research-data-collection)

**Self-report/behavioral features**
- Oura: users add "Tags" to log lifestyle habits (coffee, hard training, alcohol) to see effects on their body — [Oura blog](https://ouraring.com/blog/readiness-score/)
- Apple: the watchOS Vitals guide includes a "Log your state of mind" section (mood logging within Apple Health) — [Apple Watch User Guide](https://support.apple.com/en-bw/guide/watch/apd15aa7ed96/watchos)
- WHOOP: the self-report journal is not listed as an input to Recovery on the support page — [WHOOP Support](https://support.whoop.com/s/article/WHOOP-Recovery)

**Hardware and cost (2026)**
- Oura membership is $5.99/month (first month free) — [Oura Membership page](https://ouraring.com/membership). Without membership only the three daily scores are visible. Ring about $399 plus $69.99/yr; 3-year cost about $609 (aggregator, verify) — [fitcoin.co](https://www.fitcoin.co/articles/best-fitness-trackers-without-subscription)
- WHOOP sells the band only with a membership: One $199/yr, Peak $239/yr, Life $359/yr (Life adds ECG and blood pressure insights) (aggregator citing WHOOP's membership page) — [askvora](https://askvora.com/wearables/best-without-subscription); [sensai.fit, prices "as last listed" 9 Oct 2026](https://www.sensai.fit/blog/fitbit-air-review-2026)
- Garmin: readiness, HRV status and Body Battery are free with the device (e.g., "Garmin Cirqa" $199.99); optional Connect+ $6.99/mo. Fitbit Air $99.99 (launched May 2026) with optional Premium $9.99/mo (aggregators) — [sensai.fit](https://www.sensai.fit/blog/fitbit-air-review-2026); [fitcoin.co](https://www.fitcoin.co/articles/best-fitness-trackers-without-subscription)

### Inferences
- Health7 should not claim that a "personal baseline" is novel. It is the industry norm. A defensible differentiator is a baseline whose **rule is visible and explained** (rules written on screen, labeled "Demonstration rule"). This directly answers the opacity criticism in Doherty 2025.
- Apple's "multiple metrics outside typical range → next-morning notification with possible factors, not for medical use" is the closest consumer analog to Health7's approach (inform, do not diagnose). Health7 can cite it as precedent for the design pattern.
- Garmin's hybrid rule (personal range, plus a population floor by age) is a useful model. A purely personal baseline can drift and "normalize" a slowly deteriorating crew member. Health7 may want to show both a personal-deviation rule and an absolute safety floor.
- Every consumer option needs dedicated hardware and most need a paired phone, account and subscription. Health7 runs with no hardware and no server, which is a real difference in the constraint space. The trade-off is that it relies on manual entry or onboard instruments instead of passive sensing.
- None of the consumer products link body findings to spaceflight-specific risks (e.g., NASA HRP risks) or to space weather. This is a domain-specific gap Health7 fills.

### Gaps
- **Offline operation**: I found no official statement from Oura, WHOOP, Garmin, Apple or Google on whether scores compute fully on-device or need cloud sync. Oura's membership gating and phone-app dependency suggest an online/account dependency, but I did not verify this.
- **Clinician-facing layer**: not verified in this session. An Oura blog URL slug ("oura-to-acquire-counsel-health") appeared in page metadata, which suggests a move toward clinician/AI-advisor services, but I did not read the content. WHOOP Life's ECG/BP features are documented only via an aggregator. Apple Health record sharing with providers was not verified.
- Oura's baseline window length was not on the page I fetched.
- Apple Watch "Series 12 / Ultra 4" model names come from the live Apple support page (Nov 2026). I did not cross-check them.

---

## 2. Remote patient monitoring (RPM) and telemonitoring: how readings are flagged, clinician dashboards, connectivity

### Takeaway
Clinical RPM programs mostly flag readings against **fixed clinical thresholds** set by guidelines or expert opinion. This produces heavy alert loads: in one 2025 program, 77% of manually handled alert actions were administrative and had no clinical impact. The literature increasingly recommends individualized thresholds, which Health7's personal-baseline logic matches. RPM still assumes an always-on link to a central platform staffed by nurses or clinicians.

### Cited Findings
- Maasstad Hospital (Rotterdam) hypertension telemonitoring, June 2022–May 2023: 174 users and 30,184 measurements triggered **17,293 alerts**. 13,647 (79%) were auto-processed by the platform and 3,646 manually by e-nurses (about 21 per user). Of 2,101 manual actions, **1,626 (77%) were administrative** (no clinical consequence) and 475 (23%) were clinical. 25 users (15%) generated more than 50% of manual alerts — [van Steenkiste et al., JMIR Med Inform 2025;13:e66066](https://medinform.jmir.org/2025/1/e66066)
- Same study: simple alert thresholds were "based on expert opinion (no guidelines available)" (e.g., systolic ≥170, diastolic ≥105 mmHg). Raising them by 10/5 mmHg would cut alerts about 47–54% and save about 5,973 nurse-minutes per year. The authors' framework includes "focusing on individual users' and user groups' needs" and individual threshold adjustment — [JMIR Med Inform 2025](https://medinform.jmir.org/2025/1/e66066)
- Personalized vital-sign alarm thresholds would cut low/high heart rate alarms by up to 50% and 44% while keeping 62% sensitivity (older, inpatient context, 2018) — [Poole et al., PMC6587573](https://pmc.ncbi.nlm.nih.gov/articles/PMC6587573/)
- An operations-research model of individualized, dynamic patient alarm settings "significantly reduces" risk compared with current alarm-setting approaches under alarm fatigue — [Piri 2022, Operations Research](https://pubsonline.informs.org/doi/10.1287/opre.2022.2300)
- Industry commentary: the "first and most impactful" fix for RPM alert fatigue is "replacing static thresholds with personalized baselines learned from each patient's own data" (vendor blog, low evidentiary weight) — [Nirmitee](https://nirmitee.io/blog/rpm-alert-fatigue-clinicians-ignore-70-percent-alerts-ai-fixes/)

### Inferences
- RPM shows the architecture Health7 imitates: patient-side measurements, rules that fire alerts, and a clinician who reviews. RPM, however, routes every alert to a staffed central team in real time. For a crew with a communication delay, Health7's "Report for ground" queued for downlink is closer to a store-and-forward pattern than to RPM.
- Health7's on-screen "Demonstration rule" labels are a transparency feature RPM rarely exposes to the patient. RPM thresholds are usually set by clinicians and hidden from the patient.
- Alert-fatigue evidence supports Health7 in two ways. It favors personal thresholds, and it argues for few, explicit rules so ground physicians are not flooded once queued reports arrive in a batch.

### Gaps
- I did not retrieve specific commercial RPM platform documentation (e.g., dashboards from Philips, Biofourmis, Validic, Health Recovery Solutions) or an explicit source on RPM behavior when connectivity is lost. Dependency on connectivity is inferred, not cited.
- No 2022–2026 systematic review quantifying fixed vs. personalized thresholds in outpatient RPM was found in this session.

---

## 3. Tools for isolated and extreme environments (Antarctica, submarines, military/expedition, offshore): health/behavioral monitoring, cognitive tests, store-and-forward telemedicine

### Takeaway
The closest operational precedents are NASA/Penn's **Cognition** battery and **store-and-forward telemedicine** at Antarctic stations. Cognition includes a 3-min PVT, stores results locally and syncs when online, and has been used on the ISS, at 4 Antarctic stations and in HERA. Antarctic medicine relies on store-and-forward consultation because evacuation can take weeks. None of these combine physiology, self-report, reaction time, risk education and a ground report in one hardware-free tool.

### Cited Findings
- **Cognition test battery** (Basner et al. 2015, Penn/NASA, with Pulsar Informatics and Joggle Research): 10 tests (15 unique forms), median 17.8 min. It includes a validated **3-min PVT** (ISI 2–5 s) with a median of 3.2 min. It runs on an ISS laptop and on Windows and iPad versions. "Results are encrypted, stored on the local hard drive, and also transmitted to a central server if Internet connection is available" (offline-first by design). It gives immediate feedback as a 0–1000 score plus the user's own historical performance — [Basner et al., Aerosp Med Hum Perform 2015, PMC4691281](https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281/)
- Cognition was deployed monthly during winter-over at **Concordia, Neumayer, Halley and SANAE** Antarctic stations, and in HERA isolation runs of 1, 2 and 4 weeks — [PMC4691281](https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281/)
- Cognition caveat: practice effects mean "performance on most cognitive tests improves with repeated administration," which "may confound or mask cognitive deficits." Some tests (e.g., VOLT) still improve after 10+ administrations. Normative data were drawn from small samples (8 astronauts/candidates and 11 mission controllers) — [PMC4691281](https://pmc.ncbi.nlm.nih.gov/articles/PMC4691281/)
- NASA is developing Cognition and Fine Motor Skills test batteries for pre-, in- and post-flight crew assessment — [NASA TM 20205008023](https://ntrs.nasa.gov/api/citations/20205008023/downloads/NASA_TM20205008023.pdf)
- Antarctic telemedicine: "Telemedicine is now widely used to obtain second opinions from consultants and is a mainstay of the organization of health care in Antarctica" (store-and-forward for station doctors; 2009, older) — [Bonnardot et al., PubMed 19139214](https://pubmed.ncbi.nlm.nih.gov/19139214/)
- British Antarctic Territory: "Injury in Antarctica can have a significant impact when considering transfer timelines of several weeks." Medical support is provided by deployed healthcare staff with telemedicine "reach-back," and the review notes influence from military practice — [Lowe & Warner 2023, Int J Circumpolar Health](https://www.tandfonline.com/doi/full/10.1080/22423982.2023.2230633) (only the abstract/metadata was accessible; full-text details not retrieved)
- ESA has sent a medical doctor to Concordia for 13 months per year for two decades. The doctor both runs biomedical experiments and serves as a research subject — [ESA: 20 years in Antarctica](https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/20_years_in_Antarctica)
- ICE monitoring design (2026 mini-review): proposes that systems "operate primarily on locally stored, low-bandwidth data, with transmission reserved for summary indicators and crisis-level alerts." Alerts route first to the on-site medical officer or crew lead, then to flight surgeons or shore clinicians "as bandwidth, communication delay, and operational security permit." Context figures: Antarctic winter-over 6–9 months, submarine patrols 60+ days, Mars one-way delay 4–24 min. Consumer wearables fail below about −10 °C, while expeditionary settings range from −40 °C to +60 °C — [Richard 2026, Front Physiol 17:1695483](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1695483/full)
- Systematic review of telemedicine for patient management on remote expeditions (not read in full) — [Semantic Scholar](https://www.semanticscholar.org/paper/22ea13bc7a679c41ea45082e3ac6817e34f1e52b); practitioner guide on telemedical "top cover" for expedition medics — [The Adventure Medic](https://www.theadventuremedic.com/coreskills/telemedicine-in-remote-and-wilderness-environments/)

### Inferences
- Health7's offline-first queue-for-downlink design matches what operational ICE tools already do: Cognition's local storage with opportunistic sync, Antarctic store-and-forward, and the 2026 review's "local data, transmit summaries" recommendation. This is good validation of the design. It is not unique, but it is correct.
- Health7's short reaction test is in the PVT family. For credibility it should acknowledge the practice-effect issue and compare results with the user's own trend after a familiarization period, which is how Cognition presents feedback. It should not compare with population norms.
- The 2026 review's routing model (on-site medical officer first, then ground as bandwidth permits) is directly reusable language for positioning "Report for ground."
- The cold-failure limit of consumer wearables (about −10 °C) is an argument for Health7 needing no special hardware in extreme terrestrial analogs. This is relevant to Antarctic analog field use, not the ISS cabin.

### Gaps
- I found no specific submarine, offshore or military health/behavioral app details (e.g., US Navy or offshore operator tools) in this session.
- I did not find official 2022–2026 documentation for NASA's "PVT+" or "Reaction Self-Test" iPad app, or for Joggle's current commercial product. Only the Joggle affiliation on the Cognition paper is confirmed.
- I could not access the full text of the BAS 2023 review (paywall/robots). Specific equipment, bandwidth figures and forms were not retrieved.

---

## 4. Mental health in isolation: self-report check-ins, evidence for daily self-report, cautions on scoring/diagnosis

### Takeaway
Repeated brief self-report (Ecological Momentary Assessment, EMA) is recommended for ICE settings because it captures within-person fluctuations that monthly questionnaires miss. A 2026 review calls the empirical evidence limited, however, and flags participant burden, cultural differences in help-seeking, validation in tiny samples, and privacy. It favors hybrid approaches that combine self-report, passive physiology and cognitive tests. This matches Health7's separate behavioral check-in plus reaction test, provided it stays non-diagnostic.

### Cited Findings
- Retrospective questionnaires and interviews cover the past week or month and sample at fixed intervals, so "transient mood or behavioral changes between contacts go undetected." EMA offers reduced recall bias, temporal precision for within-person fluctuations, ecological validity, and reduced social desirability bias through brief automated prompts — [Richard 2026, Front Physiol](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1695483/full)
- Feasibility precedents cited: Mars-500 (17-month confinement) showed that "repeated structured neurobehavioral assessments are feasible," and FMARS showed feasibility over a 4-month simulated Mars mission — [Richard 2026](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1695483/full)
- Cautions: "Limited empirical evidence suggests that hybrid approaches combining multiple assessment modalities may be most promising." Obstacles include "technological constraints, participant burden, cultural considerations, and validation challenges." Environment-specific validation conventionally needs about n=200 per environment, while total long-duration ISS crew "is in the low hundreds." Even brief interruptions "may be unacceptable during critical operations." Privacy calls for local feature extraction / differential privacy — [Richard 2026](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1695483/full)
- Earlier Antarctic studies document mood/behavior changes over winter linked to social and environmental factors (older but foundational) — [Palinkas/Houseal et al. 2000](https://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.992.1430&rep=rep1&type=pdf); a crew study of mood and coping modulated by group dynamics — [Tortello et al. 2021](https://ube.hal.science/hal-03552010/document)
- NASA HRP is studying team dynamics during Antarctic winter-over as an analog for long-duration missions — [NASA: Clowning Around Lightens the Load](https://www.nasa.gov/humans-in-space/clowning-around-lightens-the-load-nasa-studies-team-dynamics-in-antarctica/)
- Consumer precedent for self-report: Apple "Log your state of mind" — [Apple Watch User Guide](https://support.apple.com/en-bw/guide/watch/apd15aa7ed96/watchos); Oura lifestyle Tags — [Oura blog](https://ouraring.com/blog/readiness-score/)

### Inferences
- Health7's split between a physiological check-up and a behavioral self-report, plus a reaction test, matches the "hybrid multimodal" recommendation. It is a defensible design choice to cite.
- Because validation samples in spaceflight are tiny, Health7's framing ("Demonstration rule", informs and refers, does not diagnose) is scientifically appropriate rather than merely legally cautious. Behavioral scores should be shown as trends against the person's own history, not as clinical cut-offs.
- Cultural and concealment issues (crews under-reporting so as not to be grounded) are a known risk to self-report. Health7 could note that its rules are visible to the crew member, which may build trust, but that it cannot prevent under-reporting. This is an inference, not evidence-backed.

### Gaps
- I found no 2022–2026 RCT or meta-analysis quantifying the benefit of daily mood self-report specifically in ICE crews. Evidence is feasibility-level.
- I did not retrieve sources on harms of mood-app scoring (e.g., mislabeling or anxiety from scores) in the general population.

---

## 5. Common criticisms: opaque scores, alert fatigue, population thresholds, cloud dependency, privacy

### Takeaway
The best-documented criticisms are opaque proprietary composite scores (none of 14 disclose formulas) and alert fatigue from fixed thresholds (77% non-clinical actions in a 2025 RPM program). Privacy and cloud-dependency concerns are recognized in reviews, and an ICE-specific review recommends local processing. Health7's transparent, offline, serverless design addresses each criticism in principle, though it has not been validated.

### Cited Findings
- Opaque scores: "None of the manufacturers disclosed their exact algorithmic formulas" — [Doherty et al. 2025](https://www.degruyterbrill.com/document/doi/10.1515/teb-2025-0001/html). Commentary by co-author Marco Altini's newsletter: composite scores lack "transparency, validation across populations" — [HRV4Training Substack](https://hrv4training.substack.com/p/week-17-an-evaluation-of-composite)
- User confusion about baselines: users report not understanding why readiness differs from sleep scores, or when baselines adjust (anecdotal) — [Reddit r/ouraring](https://www.reddit.com/r/ouraring/comments/zkc4wd/will_oura_ever_adjust_personal_baseline_metrics/); "What am I supposed to do with this information?" about Apple Vitals outliers (anecdotal) — [Reddit r/AppleWatch](https://www.reddit.com/r/AppleWatch/comments/1h0bdx8/outliers_in_vitals/)
- Alert fatigue/population thresholds: [JMIR Med Inform 2025](https://medinform.jmir.org/2025/1/e66066); [Poole et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6587573/)
- Privacy: a 2025 review on what clinicians should tell patients about wearable privacy — [Pergolizzi et al. 2025, PMC12020962](https://pmc.ncbi.nlm.nih.gov/articles/PMC12020962/); privacy, ethics and transparency in AI wearables — [Radanliev 2025, Front Digit Health](https://www.frontiersin.org/journals/digital-health/articles/10.3389/fdgth.2025.1431246/full); zero-trust for wearable data across devices, apps and cloud — [Cloud Security Alliance, Sep 2026](https://cloudsecurityalliance.org/blog/2026/09/15/securing-wearable-health-data-with-zero-trust). I only saw these as search snippets; the specific findings were not read.
- ICE-specific privacy/bandwidth: recommends on-device feature extraction and transmitting only summaries — [Richard 2026](https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2026.1695483/full)
- Subscription lock-in: Oura shows only three scores without its membership, and WHOOP has no non-subscription option (aggregators) — [askvora](https://askvora.com/wearables/best-without-subscription)

### Inferences
- **Where terrestrial tools do well:** mature passive sensing (HRV, RHR, temperature, SpO2), personal baselines, next-morning outlier notifications (Apple), validated short PVT with local storage (Cognition), store-and-forward clinical consultation (Antarctica), and feasibility of repeated self-report in long confinement (Mars-500).
- **Where they fall short for a crew far from Earth:** (1) proprietary, unexplained scores; (2) dependency on vendor hardware, phone pairing, cloud accounts and subscriptions; (3) RPM's fixed thresholds and real-time staffed-center model, which assume continuous connectivity; (4) no integration of space-specific risk context (NASA HRP risks, radiation/space weather); (5) physiology, behavior, cognition and the ground report sit in separate tools; (6) wearables fail in extreme cold and are validated on Earth populations.
- **Health7's credible differentiators:** transparent on-screen rules, hardware-free and serverless operation, offline queue to ground, a single integrated daily flow, and spaceflight risk context. Its weaknesses compared with comparables: no passive sensing (relies on entered values), unvalidated rules (correctly labeled as demonstration), and no clinician-side dashboard of its own.

### Gaps
- No source directly documenting consumer wearables failing or degrading without internet/cloud access.
- I did not read the full text of the privacy reviews, so no specific statistics (e.g., data sharing with third parties) are cited.
