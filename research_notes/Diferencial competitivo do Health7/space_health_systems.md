# Real astronaut health monitoring and medical-autonomy systems (agencies, commercial, analogs) — positioning notes for Health7

Research date: 2026-11-14. Sources were fetched in this session unless marked otherwise. "Inference" means my reasoning from the cited facts, not something a source states.

## NASA: ISS operations (CHeCS, flight surgeon, Standard Measures, Reaction Self Test) and exploration programs (ExMC, MDA, CDSS, EIMO)

### Takeaway
On the ISS, crew healthcare is run from the ground. Each mission has an assigned flight surgeon who holds weekly private medical conferences. A crew medical officer on board, usually not a physician (about 40 h of training), runs the CHeCS hardware. Research tools such as Spaceflight Standard Measures, the Reaction Self Test and the Cognition battery collect behavioral data and self-reports. NASA's exploration work (ExMC, Medical Data Architecture, clinical decision support, EIMO) states plainly that deep-space crews must detect, diagnose, treat and prevent problems on their own because of communication delay. These systems are still concepts, prototypes and research. I found no fielded crew-facing system.

### Cited Findings
**ISS operations today**
- Healthcare on the ISS is "managed primarily by a team of clinical practitioners on Earth." Each mission has "a dedicated, console-certified, flight surgeon (FS) … who maintains direct communication capability with the ISS crew and conducts weekly personal medical conferences (PMCs) with each crew member." — [Russell et al. 2023, npj Microgravity](https://www.nature.com/articles/s41526-023-00284-1)
- "A crew medical officer (CMO) is always on the ISS. More commonly the role of CMO is assigned to a non-physician astronaut who has approximately 40 h of medical training." The paper also says "On the ISS, the crew is effectively earth-dependent for their healthcare needs." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- The Crew Health Care System (CHeCS) is the ISS medical hardware suite, and NASA publishes a catalog of it ("ISS Medical Hardware Catalog, Version 10.0"). — [NTRS 20110022379](https://ntrs.nasa.gov/citations/20110022379)
- NASA Biomedical Engineer (BME) flight controllers "ensure crew health and safety by planning, facilitating, and monitoring all ISS activities involving crew health, medical operations, and CHeCS hardware." They also schedule private video conferences between crew and ground (search-result excerpt; the scraped page did not return the full list). — [NASA BME page, modified 2026-03-09](https://www.nasa.gov/directorates/esdmd/hhp/biomedical-flight-controllers/)
- Crew medical information, including private medical and family conferences, is legally protected from disclosure by other ISS crewmembers without consent, except for immediate safety. — [14 CFR Part 1214](https://www.ecfr.gov/current/title-14/part-1214)
- NASA assigns a flight surgeon to each crew once the crew is assigned to a mission. The surgeon oversees health care and medical training. — [NASA Flight Surgeons](https://www.nasa.gov/directorates/esdmd/hhp/flight-surgeons/)

**Spaceflight Standard Measures (research, ISS)**
- Standard Measures includes actigraphy and light exposure from a wrist sensor, sleep reports, fluid samples (diet and nutrition), saliva (immune function), cognition tests, sensorimotor tests and a total-body strength test. — [NASA Standard Measures](https://www.nasa.gov/reference/standard-measures/)
- Sleep Quality/Team questionnaire: "Astronauts complete a questionnaire after they wake up that measures sleep quality and quantity, and another questionnaire before going to sleep about mood, team cohesion and performance, and crew livability and habitability." This lets researchers compare perceived sleep with actigraphy. — [NASA: Spaceflight Standard Measures](https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/)
- NLSP lists the behavioral-health measures in Standard Measures as Actigraphy, Cognition, Personality Questionnaire and Sleep Quality/Team Questionnaire. — [NLSP Standard Measures](https://nlsp.nasa.gov/resources/standard-measures)
- The earlier Behavioral Core Measures investigation "evaluated and verified a suite of measurements of mood, stress, sleep quality, fatigue, cognition, performance, and team functioning." — [NASA Science Highlights, May 30 2022](https://www.nasa.gov/missions/station/space-station-science-highlights-week-of-may-30-2022/)

**Reaction Self Test (PVT) — the inspiration for the Health7 reaction test**
- The Reaction Self Test (RST) is the operational ISS name for the Psychomotor Vigilance Self Test. It is "intended to provide astronauts in spaceflight with objective feedback on neurobehavioral changes in vigilant attention, psychomotor speed, state stability, and impulsivity … as well as recording their subjective ratings of workload, sleep timing and quality, tiredness, fatigue, and stress." PI: David F. Dinges. The project ran 2008-08-01 to 2017-12-31 and is listed as completed. — [NASA TechPort 23201](https://techport.nasa.gov/projects/23201)
- Recorded data: Time in Bed, Total Sleep Time, Poor Sleep Quality, Sleepiness, Tiredness, Fatigue, Physical Exhaustion, Stress, Workload, Caffeine Consumption, PVT Response Speed, Lapses, Premature Responses and PVT Performance Score. — [TechPort 23201](https://techport.nasa.gov/projects/23201)
- NASA briefing slides call it a "computerized 5-minute Reaction Self Test … intended as a personalized aid to astronauts for fatigue management." It includes self-rating sliders such as "Mentally sharp ↔ Mentally fatigued" and "Not stressed at all ↔ Very stressed." One stated objective was to evaluate whether RST "is useful to astronauts for assessing performance capability and utilizing fatigue countermeasures." — [NTRS 20090029851 (PDF slides, search excerpt)](https://ntrs.nasa.gov/api/citations/20090029851/downloads/20090029851.pdf)
- The test length is described inconsistently. TechPort's search snippet says "3-minute PVT Self Test," while the slides and the LabXchange case study say 5 minutes. — [TechPort](https://techport.nasa.gov/projects/23201); [LabXchange](https://www.labxchange.org/library/items/lb:LabXchange:afef2137:lx_case_study:1)
- RST was used during NASA's One-Year Mission. — [phys.org 2015](https://phys.org/news/2015-06-dont-stress-small-nasa-one-year.html)

**WinSCAT and the Cognition battery**
- "NASA has been assessing crewmember cognitive function using the WinScat test battery (Kane et al., 2005)." Because WinSCAT focuses mainly on executive working memory, NASA developed a broader battery. — [Beard et al., NASA TM-20205008023](https://ntrs.nasa.gov/api/citations/20205008023/downloads/NASA_TM20205008023.pdf)
- The Cognition Test Battery has 10 subtests: Motor Praxis, Visual Object Learning, Fractal 2-Back, Abstract Matching, Line Orientation, Emotion Recognition, Matrix Reasoning, Digit-Symbol Substitution, Balloon Analog Risk and PVT. "Immediately after sub-test completion participants are shown graphic feedback scores." Normative data came from 91 "astronaut-like" pilots. In that study the battery ran on an HP ZBook laptop. — [NASA TM-20205008023](https://ntrs.nasa.gov/api/citations/20205008023/downloads/NASA_TM20205008023.pdf)

**ExMC, Medical Data Architecture, CDSS, EIMO (exploration)**
- "The Exploration Medical Capability (ExMC) element of NASA's Human Research Program (HRP) is investigating the feasibility and value of advanced capabilities to promote and enhance EIMO… an exploration crew will need to autonomously detect, diagnose, treat, and prevent medical events." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- Communication delay: "One-way communication delays can be more than 20 min." In their illustrative scenario, a ground response "may take anywhere from 45 min to several hours to reach the crew." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1). Levin et al. give "up to a 10 second 2-way" delay for the Moon and "as long as 40 minutes" 2-way for Mars. — [Levin et al. 2023, IEEE OJEMB (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10810302/)
- EIMO definition: "the transition of medical primacy from terrestrial to space-based assets… Terrestrial assets will continue to provide pre-mission screening, planning, maintenance, and prevention while onboard care, response to unexpected medical events, management of communication delays, and caring for crew members during communication dropouts will increasingly be required of the crew." The five components are Pre-Mission Planning, Acute and Emergent Management Decision Making, Prolonged Medical Management Decision Making, Supplies and Resource Management, and Task Load Management. — [Levin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10810302/)
- Required CDSS functions listed: "reduce user cognitive workload, help to maintain situational awareness… provide management of alerts filtering non-critical events and tailor assessments or recommendations to specific patients, aligned with their medical histories… provide health maintenance guidance." The paper also calls for "ambient detection… keyboard timing metrics to assess cognitive performance." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- Design constraints on a CDSS: it must "operate with distance-created communication lags and vehicle-imposed restrictions on computing power, mass, volume, and electrical power." Spaceflight stressors (circadian disruption, confinement, CO2) "affect cognitive processes which could affect the crew's ability to respond to medical events." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- The paper's preliminary analysis found that "increasing the cognitive ability of the crew… has the largest improvement on LOCL, need for evacuation, and consumption of resources," and that cognitive skills mattered more than procedural ones. — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- On the burden of prevention: "Prevention is challenging for the crew as information is required to inform digital models potentially taking time and attention away from other mission tasks." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- NASA Ames hosts a page on "A Clinical Decision Support System for Earth-independent Medical Operations." — [NASA Ames](https://www.nasa.gov/centers-and-facilities/ames/ames-science/ames-space-biosciences/a-clinical-decision-support-system-for-earth-independent-medical-operations/)
- Crew medical training for EIMO: if the physician is incapacitated, "a non-physician crew medical officer (CMO) will be needed. In truly independent operations, onboard resources such as just-in-time training, mixed reality, decision support tools, and AI-enabled chatbot 'consultants' will be needed." — [NTRS 20230015504](https://ntrs.nasa.gov/citations/20230015504)
- The Medical Data Architecture (MDA) project "supports the Exploration Medical Capability (ExMC) risk" and "will develop capabilities that support autonomous data collection." Project status reports are dated 2017–2020. — [NTRS 20180001236](https://ntrs.nasa.gov/citations/20180001236); [NTRS 20190000384](https://ntrs.nasa.gov/api/citations/20190000384/downloads/20190000384.pdf); [NTRS 20200000568](https://ntrs.nasa.gov/citations/20200000568)
- A 2024 ExMC presentation (Lehnhardt) gives "an overview of our work from across our portfolio, all of which will inform future EIMO." — [NTRS 20230015831](https://ntrs.nasa.gov/citations/20230015831)
- EIMO technical interchange meetings in 2025 aimed to "better understand gaps between current approaches" (abstract only). — [Anderson et al. 2025, PubMed](https://pubmed.ncbi.nlm.nih.gov/39865932/)

### Inferences
- What is operational on the ISS is ground-centric. The flight surgeon and BME team hold the interpretation, and the crew executes procedures and collects data. Health7's "Report for ground" plus downlink queue matches this real workflow, including the weekly-conference rhythm. Its crew-side, delay-aware framing matches the stated EIMO direction.
- The Reaction Self Test is the closest official precedent for Health7's check-in plus reaction test: a short PVT, subjective sliders (fatigue, stress, workload, sleep), and feedback to the astronaut. Health7 can honestly say it is inspired by it. It should not claim to be validated like it, because Health7's test has no PVT-grade timing validation.
- The functions NASA lists for a CDSS ("management of alerts filtering non-critical events," "tailor… to specific patients, aligned with their medical histories," reducing cognitive workload) are close to Health7's personal-baseline comparison and transparent alert rules. NASA's target system, however, also covers diagnosis and treatment guidance. Health7 deliberately excludes that ("informs and refers"), so it covers the preventive, monitoring slice only.

### Gaps
- I could not confirm the current (2025–2026) operational status of CDSS or MDA prototypes. The MDA status reports I found run only to 2020, and the 2025 EIMO paper was available as an abstract only.
- I did not retrieve a primary source that describes the ISS "Periodic Health Status" or "Periodic Fitness Evaluation" protocol (frequency, content). These are not cited here.
- I did not verify whether RST or WinSCAT results are compared to each astronaut's own pre-flight baseline. I believe WinSCAT was used that way, but I found no source in this session. Treat that as unverified.
- I did not verify the HRP risk count ("17 risks") against humanresearchroadmap.nasa.gov. Russell et al. say "over 30 risks" are researched across agencies, and NASA's own count depends on which list and revision is used. Health7 should check the count it displays.
- Communication-delay figures differ slightly: ">20 min one-way" versus "up to 40 min two-way" for Mars. Both are consistent with each other. Neither source gives the exact minimum and maximum.

## CSA (Bio-Monitor/Astroskin, Bio-Analyzer, Health Beyond) and ESA equivalents

### Takeaway
CSA's Bio-Monitor is dedicated wearable hardware: a smart shirt (Astroskin by Hexoskin), a headband and a tablet app. It measures vital signs, and its data is downloaded to Earth for science. Bio-Analyzer gave quick in-orbit blood and urine results. CSA's Health Beyond initiative (launched 2019) explicitly aims to let deep-space crews "manage their own health… with minimal dependence on support from Earth," using AI-integrated "Connected Care Medical Modules." ESA material was thinner. Its analog work centers on Concordia (Antarctica) and Mars-500 psychology and cognition research.

### Cited Findings
- Bio-Monitor "includes a smart shirt, headband and dedicated tablet application." It measures heart rate and ECG, blood pressure, breathing rate and volume, skin temperature, SpO2 and physical activity. It launched to the ISS in December 2018. — [CSA Bio-Monitor (modified 2026-02-26)](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp)
- Data flow: an astronaut "can use a tablet application to specify the type of activity and see his or her vital signs throughout the session… the astronaut disconnects the battery pack and plugs it into a base, which downloads the data to Earth… for scientific analysis." — [CSA Bio-Monitor](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp)
- Hexoskin designed Bio-Monitor for CSA. — [Hexoskin blog](https://hexoskin.com/blogs/news/bio-monitor-astroskin-to-launch-to-the-international-space-station)
- In 2019 CSA astronaut David Saint-Jacques was the first to use Bio-Monitor in space, as part of the "Space Health" study. — [CSA Space Health study](https://www.asc-csa.gc.ca/eng/sciences/space-flight-improve-monitor-health-earth.asp)
- Bio-Analyzer's "main objective… was to provide test results from space within two to three hours, thus reducing the need to freeze and return samples." The page uses the past tense. — [CSA Bio-Analyzer](https://www.asc-csa.gc.ca/eng/iss/bio-analyzer.asp)
- Health Beyond, launched 2019: "Our objective is to stimulate and support innovative and sustainable solutions that will address the healthcare challenges faced by astronauts in deep space and people living in areas of Canada where there are fewer healthcare services." The page lists these challenges: limited access to providers, "longer delay in telecommunication with support teams on Earth," medical emergencies and resupply, and "psychological health." — [CSA About Health Beyond (modified 2025-07-17)](https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp)
- Connected Care Medical Modules (C2M2s) "are equipped with an AI‑based computer system that integrates and connects the most recent medical technologies… The long-term objective of C2M2s is to equip astronauts to manage their own health throughout deep-space missions with minimal dependence on support from Earth." Health Beyond is funded through the Lunar Exploration Accelerator Program (LEAP). — [CSA About Health Beyond](https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp)
- The Deep Space Healthcare Challenge, run with Impact Canada, sought "new, autonomous solutions to detect and diagnose health issues" for remote communities and eventually astronauts. — [Impact Canada](https://impact.canada.ca/en/challenges/deep-space-healthcare-challenge); [CSA](https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp)
- CSA published a report from its Advisory Council on Deep Space Healthcare. — [CSA Health Beyond report](https://www.asc-csa.gc.ca/eng/publications/health-beyond-report-advisory-council-deep-space-healthcare.asp)
- ESA offers research opportunities in Mars-500 and Concordia to "mimic the psychological and…" conditions of exploration (search snippet only). — [ESA Psycho-sociological issues](https://www.esa.int/Enabling_Support/Preparing_for_the_Future/Space_for_Earth/Space_for_health/Psycho-sociological_issues_Cognition_and_performance)
- At Concordia, an ESA-sponsored medical doctor did 13 months of biomedical research on herself and the crew. The earlier "Mindful Ice I" study found "a strong correlation between mindfulness and mental wellbeing, reducing stress and improving crew dynamics." — [ESA Concordia blog, 2026-02-18](https://blogs.esa.int/concordia/2026/02/18/in-the-midst-of-winter-i-found-there-was-within-me-an-invincible-summer/)

### Inferences
- Bio-Monitor shows the typical pattern: dedicated sensors, crew sees live values during a session, and the analysis happens on the ground for science. Health7 takes a different approach: no hardware, manual or self-reported entry, and personal-baseline comparison done on the crew side. That is a real difference, but Health7 trades away sensor-grade data.
- C2M2 is the agency concept closest to Health7's long-term thesis of crew self-management with minimal Earth dependence. Health7 can cite it as alignment, not as competition, since C2M2 is an AI-integrated medical module and not a lightweight app.

### Gaps
- I did not obtain primary ESA information on a dedicated "crew medical support office" or an ESA crew-facing health software tool.
- I did not confirm the current (2025–2026) operational status of Bio-Monitor on the ISS, or whether Astroskin flies on Artemis.
- I did not confirm Deep Space Healthcare Challenge winners or C2M2 deployment status.

## Commercial and research programs (TRISH EXPAND, Inspiration4/SOMA, Polaris Dawn, Axiom, vendors)

### Takeaway
Commercial missions have become research platforms. TRISH EXPAND collects pre-, in- and post-flight data from Inspiration4, Axiom Ax-1 to Ax-4, Polaris Dawn, Fram2, Blue Origin NS-28 and Space Adventures MS-20. The data includes cognition, questionnaires and wearables (Apple Watch, BioIntelliSense BioButton) and goes into a researcher-access database. The goal is research data aggregation, not crew-facing decision support. Polaris Dawn also tested a commercial diagnostic and telemedicine device that uses Starlink.

### Cited Findings
- EXPAND "works with commercial spaceflight providers and their passengers to collect biomedical data before, during, and after spaceflight. This information is curated in TRISH's EXPAND database, which provides select researchers access to biological samples and data." — [NASA HRP TRISH page](https://www.nasa.gov/hrp/the-translational-research-institute-for-space-health-trish/)
- EXPAND measures include cognitive performance (memory, spatial orientation, abstraction, emotion recognition, risk decision making, sustained attention; Basner) and "Standardized research questionnaires on sleep, personality, health history, team dynamics, and immune-related symptoms." They also include sensorimotor tests, wearable continuous monitoring with the BioIntelliSense BioButton, Butterfly IQ+ ultrasound, QuickSee vision checks, Apple Watch vitals, and in-flight blood and saliva immunoassay. Missions listed: Inspiration4, Axiom Ax-1 to Ax-4, Polaris Dawn, Fram2 (launched 2025-03-31), Blue Origin NS-28 (2024) and Space Adventures MS-20. — [BCM EXPAND](https://www.bcm.edu/academic-centers/space-medicine/expand)
- TrialX was selected in 2021 to build the EXPAND Database and Biorepository. — [TrialX](https://trialx.com/space-health-research-expand-database/)
- The Inspiration4 battery covered "blood, stool, urine, biopsy and saliva samples, ultrasound measurements… cognitive and sensorimotor tests, surveys and physiological data collected with an Apple smartwatch." Ultrasound research was done "in full crew autonomy, with minimal pre-flight familiarization and reliance on experiment-specific just-in-time (JIT) instruction." The crew "provided valid and usable data on cardiovascular physiology, cognitive performance and behavioural states." — [Nature 2024, Inspiration4](https://www.nature.com/articles/s41586-024-07648-x)
- SOMA is "an integrated data and sample repository for clinical, cellular and multi-omic research profiles," published in June 2024. — [Overbey et al. 2024 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11357981/); [SOMA portal](https://soma.weill.cornell.edu/)
- On Polaris Dawn (launched 2024-09-10), TRISH-linked studies covered "behavior, sleep, bone density, eye health, cognitive function." The crew also tested a commercial device with "an experimental telemedicine feature… the device will attempt to offer an appropriate diagnosis based on crew inputs and available documentation," using Starlink to reach doctors, in a simulation. Crew self-reported motion-sickness symptoms and interventions. — [NASA Polaris Dawn](https://www.nasa.gov/humans-in-space/nasa-to-test-telemedicine-gather-essential-health-data-with-polaris-dawn-crew/)

### Inferences
- The commercial programs share three traits: hardware-heavy (wearables, ultrasound, assays), researcher-facing (data ends up in databases such as EXPAND and SOMA), and time-lagged (analysis after flight). None of the sources describe a crew-facing daily interpretation against a personal baseline. That is the space Health7 can occupy, as a complement and not a competitor.
- The Polaris Dawn device is the nearest commercial analogue to crew-facing decision support, but it attempts diagnosis. Health7's "no diagnosis" boundary is a clear and defensible difference.

### Gaps
- I did not research Axiom Space's own crew-health program pages directly; only its participation in EXPAND is cited.
- I did not identify dedicated startups (beyond the vendors named in EXPAND) that sell crew-health monitoring software for spaceflight. I found no sourced list.
- The name of the Polaris Dawn telemedicine device was not given on the NASA page.
- Whether EXPAND returns data or interpretation to the crew is not stated on the BCM page.

## Analogs (HERA, CHAPEA, Mars-500, Antarctica)

### Takeaway
NASA runs HERA (small habitat at Johnson Space Center) and CHAPEA (year-long Mars simulation; Mission 1 from 2023-06-25 to 2024-07-06, Mission 2 began 2025-10-19) to study crew health and behavioral performance. ESA uses Concordia and used Mars-500. Public pages describe the data collected only in general terms ("physical and behavioral health and performance"). Self-report and cognition batteries are the standard tools.

### Cited Findings
- HERA is a "650-square-foot habitat split among two floors and a loft, designed to serve as an analog for isolation, confinement, and remote conditions in exploration scenarios." NASA also lists CHAPEA and Antarctic missions as behavioral-performance analogs. — [NASA Human Factors and Behavioral Performance](https://www.nasa.gov/hrp/human-factors-and-behavioral-performance/)
- CHAPEA "is a series of analog missions that will simulate year-long stays on the surface of Mars." Mission 1 ran 2023-06-25 to 2024-07-06. Mission 2 began 2025-10-19. Crew provide data that "may include physical and behavioral health and performance." — [NASA About CHAPEA (updated 2025-11-18)](https://www.nasa.gov/humans-in-space/chapea/about-chapea/)
- CHAPEA Mission 2 crew perform blood collections to monitor their health, and the crew had passed 300 days in the habitat. — [NASA CHAPEA Mission 2](https://www.nasa.gov/humans-in-space/chapea/chapea-mission-2/)
- Concordia (Antarctica, "white Mars") is used by ESA for biomedical and psychological research, including mindfulness studies (Mindful Ice I/II). — [ESA Concordia blog](https://blogs.esa.int/concordia/2026/02/18/in-the-midst-of-winter-i-found-there-was-within-me-an-invincible-summer/)

### Inferences
- Analog missions are where Health7 could most plausibly be piloted (inference). Their crews are research volunteers, delays are often simulated, and the monitoring needs (self-report, cognition, team cohesion) match Health7's behavioral module.

### Gaps
- The public CHAPEA page does not say whether a communication delay is simulated, or how many seconds or minutes. I could not confirm this in this session, although I believe CHAPEA does simulate Earth–Mars delays.
- I did not retrieve primary sources on HERA's specific behavioral instruments, on Mars-500 monitoring tools, or on WinSCAT/Cognition use in analogs.

## Comparison: who, what hardware, offline or autonomous, personal baseline, transparency, behavioral, ground layer, public availability

### Takeaway
Every real system found either needs dedicated hardware (CHeCS, Bio-Monitor, wearables, assays) or is research data collection whose analysis happens later on the ground (Standard Measures, EXPAND, SOMA). The systems that would give crews autonomous interpretation (CDSS, C2M2) are concepts or prototypes and are not public. The nearest crew-facing precedent is the Reaction Self Test and Cognition battery, which give immediate feedback. None of the sources describe crew-visible, rule-transparent alerting against a personal baseline as a fielded product.

### Cited Findings (per-system attributes, sourced above)
| System | Target user | Hardware | Offline / autonomous | Personal baseline | Logic transparent to crew | Behavioral health | Ground layer | Public |
|---|---|---|---|---|---|---|---|---|
| ISS CHeCS + flight surgeon PMCs | ISS crew and NASA medical team | Dedicated medical rack and devices ([NTRS](https://ntrs.nasa.gov/citations/20110022379)) | No; "earth-dependent" ([Russell 2023](https://www.nature.com/articles/s41526-023-00284-1)) | Not stated in sources | Interpretation is done by the ground | Via private conferences (not detailed) | Yes, weekly PMCs ([Russell 2023](https://www.nature.com/articles/s41526-023-00284-1)) | No |
| Spaceflight Standard Measures | Researchers, using crew data | Wrist actigraph, samples, tests ([NASA](https://www.nasa.gov/reference/standard-measures/)) | Collected on board, analyzed later | Pre/in/post design (inferred) | No (research) | Yes: sleep, mood, team cohesion questionnaires ([NASA](https://www.nasa.gov/humans-in-space/spaceflight-standard-measures-characterizing-how-humans-adapt-in-space/)) | Researchers | Data via NLSP ([NLSP](https://nlsp.nasa.gov/resources/standard-measures)) |
| Reaction Self Test | Astronauts (fatigue self-management) | Software on station computer (exact hardware not confirmed) | Yes, gives immediate feedback ([TechPort](https://techport.nasa.gov/projects/23201)) | "Personalized aid" ([NTRS slides](https://ntrs.nasa.gov/api/citations/20090029851/downloads/20090029851.pdf)); exact baseline method not confirmed | Partial (objective feedback) | Yes (fatigue, stress, sleep, workload) | Data used by researchers | Ended 2017; not public software |
| Cognition battery | Astronauts / researchers | Laptop (iPad for the fine motor skills battery) ([TM](https://ntrs.nasa.gov/api/citations/20205008023/downloads/NASA_TM20205008023.pdf)) | Runs locally | Normative data from 91 pilots; graphic feedback | Shows scores | Yes (cognition) | Researchers | Not public (not confirmed) |
| CDSS / EIMO / MDA | Future CMOs on exploration missions | Onboard computing with constraints | Designed to be | Calls for tailoring to medical history | Not addressed in the sources read | Mentions cognitive stressors | Yes, ground-crew integration in scenario | Concept / prototype |
| CSA Bio-Monitor | ISS astronauts + scientists | Smart shirt, headband, tablet ([CSA](https://www.asc-csa.gc.ca/eng/sciences/bio-monitor.asp)) | Live display; data downloaded to Earth | Not stated | Shows raw vitals | No | Scientists on Earth | No |
| CSA C2M2 (Health Beyond) | Deep-space crews and remote communities | AI-integrated medical module | Goal: "minimal dependence on support from Earth" ([CSA](https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp)) | Not stated | Not stated | Lists psychological health as a challenge | Not stated | No (concept/development) |
| TRISH EXPAND | Researchers (commercial crews give data) | Apple Watch, BioButton, ultrasound, assays ([BCM](https://www.bcm.edu/academic-centers/space-medicine/expand)) | Post-flight analysis | Pre/in/post-flight design | Not stated | Yes (questionnaires, cognition) | Researcher database | Select researchers only ([NASA](https://www.nasa.gov/hrp/the-translational-research-institute-for-space-health-trish/)) |
| Polaris Dawn diagnostic/telemedicine device | Commercial crew | Commercial device + Starlink ([NASA](https://www.nasa.gov/humans-in-space/nasa-to-test-telemedicine-gather-essential-health-data-with-polaris-dawn-crew/)) | Attempts a diagnosis from crew inputs | Not stated | Not stated | No | Telemedicine to Earth doctors | Not stated |

### Inferences
- **Honest positioning for Health7:**
  - It is a software-only, crew-facing, offline-first layer that turns daily self-entered data and a reaction test into explainable deviations from the person's own baseline.
  - It packages that output for the flight surgeon under delay.
  - It occupies the preventive and monitoring slice of the EIMO and CDSS vision, which Russell et al. say should reduce crew workload, filter alerts and tailor to the individual. It does not do the diagnosis and treatment part.
- **What Health7 should not claim:**
  - Sensor-grade physiological data (Bio-Monitor and wearables have it; Health7 does not).
  - Validated psychometrics (RST, WinSCAT and Cognition were validated; Health7's test is only "inspired by").
  - Clinical decision support.
  - Being "the first" crew-facing tool, since RST and Cognition already gave crews feedback.
- **Strongest differentiators supported by the sources:**
  - Transparent, on-screen alert rules. None of the sources I read describe crew-visible rule logic.
  - No special hardware.
  - Combining physiological and behavioral check-ins in one place.
  - An explicit ground-report and delay model aligned with EIMO's "management of communication delays."

### Gaps
- None of the sources I read explicitly name explainability or transparency of algorithms to non-physician crew as a NASA gap. Russell et al. stress cognitive workload, CMO expertise limits and teaming intelligence, but the word "transparency" did not appear in the extracted text. Health7 should frame transparency as its own design choice, consistent with those concerns, not as a NASA-named gap. (Unverified: HRP Roadmap gap entries may mention it, but I did not fetch humanresearchroadmap.nasa.gov.)

## Gaps NASA and partners explicitly name

### Takeaway
The sources name these needs explicitly:
- Crew autonomy because of communication delay and dropouts
- Augmenting non-physician CMOs (about 40 h of training) with decision support, just-in-time training and AI consultants
- Reducing cognitive workload and filtering alerts
- Tailoring to each individual's medical history
- Lack of data for long-duration exploration missions
- Operating under compute, mass and power limits
- Psychological health as a deep-space challenge
- Prevention competing with crew time

### Cited Findings
- "The CMO may, or may not, have the expertise required to detect, diagnose, and treat emergent medical conditions." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- "Experience with LDEM [long-duration exploration missions] is lacking." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- "A CDSS must provide real-time support to effectively enable increased crew autonomy for managing anticipated and unanticipated medical conditions." — [Russell et al. 2023](https://www.nature.com/articles/s41526-023-00284-1)
- "Without appropriate crew training and KSA, cutting-edge medical equipment has little value… decision support tools, and AI-enabled chatbot 'consultants' will be needed." — [NTRS 20230015504](https://ntrs.nasa.gov/citations/20230015504)
- EIMO requires the crew to handle "management of communication delays, and caring for crew members during communication dropouts." — [Levin et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10810302/)
- CSA lists "longer delay in telecommunication with support teams on Earth" and "psychological health affected by living in a spacecraft in an extreme environment for a long time" as challenges. — [CSA Health Beyond](https://www.asc-csa.gc.ca/eng/health/health-beyond-initiative/about.asp)
- The 2025 EIMO technical interchange meetings addressed "gaps between current approaches" and the EIMO vision (abstract). — [Anderson et al. 2025](https://pubmed.ncbi.nlm.nih.gov/39865932/)

### Inferences
- Health7 maps onto several named needs: delay-aware ground reporting, crew-side early detection against a personal baseline, behavioral and psychological check-ins, low compute and no hardware, and low-time daily check-ups. The low-time point addresses the stated tension that prevention takes crew attention.

### Gaps
- I did not fetch the official HRP gap IDs and wording (for example ExMC or BHP gaps on humanresearchroadmap.nasa.gov). If the team wants to cite a specific gap code, it still needs to look it up there.
