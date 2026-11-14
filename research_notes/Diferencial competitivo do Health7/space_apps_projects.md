# Space Apps projects on astronaut health: catalogue of comparable hackathon work (for Health7)

Research date: 2026-11-14. Note: the 2026 hackathon itself runs November 14-15, 2026 ([Space Apps home](https://www.spaceappschallenge.org/); [GitHub discussion #1799](https://github.com/nasa/spaceapps/discussions/1799)), so 2026 projects are still being built and no 2026 winners exist yet. Everything below about 2026 competitors comes from public repos and team pages published before or during the event.

Legend: **[Confirmed]** = stated on the cited page. **[Inferred]** = my reading, not stated in a source.

## Q1. Official 2026 challenge text, resources and judging criteria

### Takeaway
The 2026 challenge asks for a *visual* self-assessment tool that collects health indicators and helps astronauts "evaluate and act on" them. It explicitly suggests a clickable human body figure, gamification, trend charts and color coding, and asks "When might a result warrant attention from the crew or from flight surgeons on the ground?" The Resources tab lists only NASA HRP web pages (5 Hazards, Risks, Ongoing Research) plus two CSA pages, and no downloadable dataset. The GO Team has confirmed that these pages satisfy the NASA-data requirement for global awards.

### Cited Findings
- **[Confirmed]** Title "Create Health Monitoring Software for Astronauts on Space Missions". Difficulty: Intermediate. Subjects: Human Exploration, Software, Space Exploration. — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Summary: "Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, and a hostile closed environment, which can bring immune changes, bone loss, cardiovascular events, and behavioral health problems. On long missions, astronauts carry much of the responsibility for spotting these changes in themselves. Your challenge is to build a health monitoring software that gathers health indicators and enables astronauts to evaluate and act on the status of their health." — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Background: the page mentions Artemis's crewed lunar flyby and plans for Mars. It cites HRP's five hazards (radiation, isolation/confinement, distance from Earth, gravity fields, hostile closed environments) and says "Astronauts must be capable of making health assessments on themselves during a mission". Example indicators: "blood pressure, heart rate, blood sugar, body temperature, daily sleep hours, and mood." — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Objective: "create a visual tool that helps astronauts assess their own health during space missions and provides guidance on treatments and health improvements". Any input type is allowed (keyboard, clicks, camera images) and any data that "represents a health indicator, such as blood sugar levels in mg/dL or ultrasound images." — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Guiding questions: "Which measurements can be performed in space? Why is an exam needed? How do spaceflight hazards affect these health indicators? When might a result warrant attention from the crew or from flight surgeons on the ground? What actions can be taken to prevent a critical health condition?" — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** UI guidance: "User interface design plays an important role in presenting metrics and diagnosis clearly… the software could display a human figure where each part of the body is clickable and displays information about its function and health status." (Note that the challenge text itself uses the word "diagnosis".) — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Optional considerations: different environments (spacecraft, station, rover, planetary base); prompting astronauts to take measurements as part of the routine; gamification; dynamic charts over time; color coding; and "Do not assume that astronauts know everything about how to assess their health… provide simple instructions and explanations." — [Challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/)
- **[Confirmed]** Resources tab, NASA: [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/), [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/), [Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/). Space agency partner (CSA): "Monitoring Radiation for Astronaut Health" (2026-02-26) and "Why Do We Conduct Science Experiments in Space?". — [Resources tab](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=resources)
- **[Confirmed]** On 2026-11-13 the GO Team answered, about this challenge: "The resources found on the … Challenge page fulfill the requirement of using at least one NASA data source in order to be eligible for global awards. It doesn't strictly have to be a dataset. Third-party materials and datasets are allowed (and encouraged) as long as you follow the referencing guidelines." A volunteer collaborator in the same thread had warned that other NASA sources "do not replace the required NASA data source" (citing discussion #1827). — [GitHub discussion #1994](https://github.com/nasa/spaceapps/discussions/1994)
- **[Confirmed]** Judging criteria, each scored 1-5:
  - **Impact**: the problem addressed and its reach.
  - **Creativity**: originality, or a meaningful improvement on existing ideas.
  - **Validity**: "scientifically sound and technically feasible… highly usable and user-friendly".
  - **Relevance**: "fully and directly addresses the challenge… meaningfully integrates NASA data, utilizing it as a core component… rather than a superficial addition".
  - **Presentation**: storytelling and clarity. The guide explicitly warns teams not to neglect it.
  — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **[Confirmed]** Eligibility: demo as a 7-slide deck or a 30-second video; English; team of up to 6; all external resources listed in References. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **[Confirmed]** Global award categories include Best Use of Science, Best Use of Data, Best Use of Technology, Galactic Impact, Best Concept, Most Inspirational, Best Storytelling, Global Connection, Art & Technology and Local Impact. — [Business Review (Romania local event), Nov 2026](https://business-review.eu/tech/it/innovation-feasibility-and-relevance-among-the-criteria-for-evaluating-projects-at-nasa-space-apps-challenge-302778)
- **[Confirmed]** A Bucharest judge (Stripe's Aleodor Tabarcea): "I'm not looking for the most polished pitch. I'm looking for teams that start with a problem, test their ideas against real data… it's the data that turns it into a solution that stands up beyond the demo." — [Business Review](https://business-review.eu/tech/it/innovation-feasibility-and-relevance-among-the-criteria-for-evaluating-projects-at-nasa-space-apps-challenge-302778)

### Inferences
- **[Inferred]** Health7's clickable 2D body figure, daily check-up, color-coded status and "Report for ground" match the challenge's own suggestions almost point for point. That alignment is good for Relevance, but it is not differentiating, because every serious competitor will build the same items (see Q5).
- **[Inferred]** For the Relevance score, Health7 should name the HRP Risks and Hazards pages, which are listed in the Resources tab, as its *core* NASA source and show them in use: the body figure linked to the 17 risks. DONKI is a valuable extra NASA dataset, but per the thread above it should not be presented as the *required* source because it is not in the Resources tab.
- **[Inferred]** The challenge text says "diagnosis". Health7's "informs and refers; does not diagnose" stance should be framed as a deliberate safety and validity choice that still answers the challenge's "act on" and "flight surgeon" questions. Otherwise judges may read it as doing less than asked.

### Gaps
- I did not fetch the general project-submission guide or discussion #1827 in full, so the exact wording of the global NASA-data rule comes only from the volunteer summary and the GO Team answer above.
- I did not find a public list of the "17 HRP risks" on the Resources page itself. That claim relies on the linked nasa.gov/hrp/risks page, which I did not scrape.

## Q2. Past Space Apps challenges on astronaut/crew health, isolation, radiation or space medicine (2019-2025)

### Takeaway
I could confirm two predecessor challenges directly: **2021 "The Trail to Mars: Can You Keep Your Crew Alive"**, an educational game for ages 10-14 about crew health risks on a Mars trip, and the **2020 Space Apps COVID-19 edition's "The Isolation Solution"**, about social isolation, which Shelter in Space won by explicitly drawing the astronaut analogy. The 2026 challenge appears to be the first *intermediate-level, crew-facing health monitoring software* challenge. Earlier health challenges targeted education or the general public rather than a crew-facing tool.

### Cited Findings
- **[Confirmed]** 2021 challenge "The Trail to Mars: Can You Keep Your Crew Alive". Statement: "Your challenge is to create an educational game for middle schoolers (approx. ages 10-14) that focuses on keeping an avatar alive and healthy during a voyage from Earth to Mars and back, and that identifies the most difficult challenges and the biggest risks involved in human spaceflight." — [2021 challenge statement page](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive); quoted via [Space Travelers project](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/teams/space-travelers-1/project)
- **[Confirmed]** 2020 COVID-19 edition challenge "The Isolation Solution": "Social distancing policies enacted the world over during the COVID-19 pandemic have left many people socially isolated. Your challenge is to develop innovative solutions to combat social isolation." — [Shelter in Space project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** The COVID-19 edition produced 1,422 projects. — [COVID-19 awards page](https://covid19.spaceappschallenge.org/awards)
- **[Confirmed]** The 2020 COVID edition also had a "Human Factors" challenge, but its winner PANAL was about COVID hotspot risk (weather, demographic and health correlations in Chile), not astronaut health. — [PANAL project](https://covid19.spaceappschallenge.org/challenges/covid-challenges/human-factors/teams/panal/project)
- **[Confirmed]** In 2025 there was at least one space-habitat challenge in which a team built "mission simulations and designing the interior of your shelter in space, be in the Moon or in Mars, select your crew members and complete the mission goals". This is habitat design, not health monitoring. — [The Homey Space Architects, 2025 team page](https://www.spaceappschallenge.org/2025/find-a-team/the-homey-space-architects/?tab=project)

### Inferences
- **[Inferred]** Predecessors were *education games* (2021) or *public wellbeing apps* (2020). That means there is little precedent of crew-facing, operational health monitoring winning at Space Apps, and judges have no established winner template for this challenge.
- **[Inferred]** From memory, and not verified in this session: 2024 (theme "The Sun Touches Everything") and 2023 had space-weather/DSCOVR challenges, and 2025 had "BioSpace" (space biology knowledge engine) and "Your Home in Space" (habitat layout). These are adjacent (radiation, space biology, habitat) rather than crew-health monitoring. Treat this as unconfirmed.

### Gaps
- I could not confirm, with an official challenge page, any 2019, 2022, 2023, 2024 or 2025 challenge specifically about astronaut health, radiation dose to crew, or space medicine. A site search for such challenges returned no matching statements. This is a search limitation, not proof of absence.
- I did not obtain the full list of 2021 Trail to Mars teams or their local awards. Known team pages include [LMC](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/teams/lmc) and [SpacePioneers](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/teams/spacepioneers/project), both marked "submitted for consideration during the Judging process"; I did not profile them.

## Q3. Winning or notable projects in those challenges and what they actually did

### Takeaway
The two confirmed health-related global winners won on **concept and storytelling**, not on clinical rigor. Shelter in Space (Best Mission Concept, 2020) was a Figma/Framer gamified wellbeing prototype grounded in HRP evidence reports. Space Travelers (Best Storytelling, 2021) was a kids' game whose stats map to the 5 HRP hazards. Neither used personal baselines, real physiological data, an offline mode or a clinical ground layer.

### Cited Findings

**Shelter in Space** (2020 COVID-19 edition, The Isolation Solution; North America; **Global Winner, Best Mission Concept**)
- **[Confirmed]** Award: Best Mission Concept, defined as "The solution with the most plausible solution concept and design." — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project); [COVID awards](https://covid19.spaceappschallenge.org/awards)
- **[Confirmed]** What it is: a "gamified mental and physical health countermeasure application". Users join a "virtual analog mission" (Mars, Moon, ISS, Europa), form crews, link third-party apps (FitBit, SleepCycle, Headspace, MyFitnessPal) into "a live health dashboard" (sleep, body temperature, caloric intake, resting and active heart rate), and "Complete NASA tests such as the psychomotor vigilance self test to assess your cognitive performance". — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** Ground/telemedicine idea: "provides adaptive countermeasures based on severity of disorder (i.e. self-treatment vs. telemedicine)". The team noted that future long-range missions "characterized by communication delays, must depend on new approaches via asynchronous telemedicine or self-treatment". — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** Personalization rationale: cites "large stable (trait-like) differences among individuals… making the development of 'one-size-fits-all' countermeasures ineffective". It *proposes* "a machine learning A/B platform to customize countermeasures"; AI is listed as future work. — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** Data and sources: NASA Human Research Roadmap, the BMed evidence report, HFBP literature, NASA Open APIs (Mars InSight weather, APOD, Mars Rover Photos), KSC nutrition tools. Built with "Framer… Figma, Javascript, JSON and REST HTTP APIs from NASA Open API's". Demo at shelterinspace.app. — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** Strong storytelling: one team member was living a 30-day self-isolation "personal analog mission" in a geodesic dome while hacking. — [Project page](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project); [shelterindome.com](https://shelterindome.com/shelter-in-space/)
- **[Confirmed]** NASA later featured the team in a winners story ("a smartphone app called Shelter in Space that would allow users to carry out their own space mission at home"). — [NASA, COVID-19 challenge winners share stories](https://www.nasa.gov/general/nasa-space-apps-covid-19-challenge-winners-share-stories-of-innovation/)
- **[Inferred]** The submission was a clickable prototype, not working analytics. No offline mode was described, and alerts were not threshold-based.

**Space Travelers** (2021, The Trail to Mars; Guayaquil, Ecuador; **Global Winner, Best Storytelling**)
- **[Confirmed]** Award and description: a game "designed for 10-14 years old to learn about the hazards astronauts could face… such as isolation, radiation, gravity fields, environment, and distance from Earth." The team had received a Global Nominee Honorable Mention the previous year. — [Meet the 2021 Global Winners](https://www.spaceappschallenge.org/blog/meet-the-2021-global-winners/)
- **[Confirmed]** Mechanics: avatar stats map to hazards ("Health: Related to distance from Earth and environmental hazard… Physical state: Related with gravity field hazard. Happiness: Related to isolation hazard"); rooms (Entertainment, Kitchen, Health, Gym); random events such as "a radiation wave". — [Project page](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/teams/space-travelers-1/project)
- **[Confirmed]** Data: HRP "website, videos and podcasts about the 5 main hazards", the Mars Exploration Program website, and JSC astronaut podcasts. No AI, wearables, offline mode or telemedicine is mentioned. — [Project page](https://2021.spaceappschallenge.org/challenges/statements/the-trail-to-mars-can-you-keep-your-crew-alive/teams/space-travelers-1/project)

**Space Intern**, team HANDAKA Space Exploration (2021, The Trail to Mars; **New York City Local Winner and Global Nominee**)
- **[Confirmed]** "an interactive role-playing game (RPG) where the player serves as an intern on NASA's first mission to Mars", styled as a paper-based game. — [UPOU news](https://www.upou.edu.ph/news/upou-student-and-team-declared-nyc-winner-and-global-nominee-in-2021-nasa-space-apps-challenge/)

**Other 2021 global winners, for context** (none in health monitoring)
- **[Confirmed]** The full award list: Ani's Cuff (Best Use of Science), Bioshi (Most Inspirational), Cambridge Asteroids (Best Use of Data), Change Maker (Best Use of Technology), Eagle AI (Global Connection), Jimmy in the Box (Art & Technology), Mohakash (Best Mission Concept), Landslide Detection Squad (Local Impact), Space Travelers (Best Storytelling), 4 Seeds (Galactic Impact). — [Meet the 2021 Global Winners](https://www.spaceappschallenge.org/blog/meet-the-2021-global-winners/)
- **[Confirmed]** A 2021 Taipei local results page references a Trail to Mars team ("teams/spacexx"). The snippet was ambiguous about its award. — [AIT Taipei results](https://www.ait.org.tw/results-of-2021-nasa-hackathon-taipei/)

### Inferences
- **[Inferred]** The historical pattern is that health-themed winners won through *narrative, gamification and a plausible mission concept* anchored in HRP's 5 hazards, not through medical accuracy.
- **[Inferred]** Shelter in Space already used several ideas Health7 uses: a PVT-style cognitive self-test, a ground escalation layer, sleep and mood tracking, and the "one-size-fits-all doesn't work" argument. Health7's claim to novelty should therefore rest on *execution*: a working offline app, personal-baseline math shown on screen, and a delay-aware downlink queue. The concepts themselves are not new.

### Gaps
- I did not find 2022-2025 global winners or nominees that address crew health. If any exist, they were not surfaced.
- I did not find local-winner lists by city for the 2021 Trail to Mars challenge beyond NYC (Space Intern).

## Q4. Patterns among winners and common weaknesses of typical submissions

### Takeaway
The winning formula is a strong story, a clear link to HRP's 5 hazards, gamification and a plausible mission concept. In 2026 the field has converged on a stronger template: dashboard, body map, color coding, personal baseline, LLM "AI doctor" and outbox to Earth. The weaknesses that remain visible are simulated-only data, simplified or invented thresholds labelled only by disclaimers, AI-doctor framing that edges toward diagnosis, and NASA data used as background reading rather than as a core component.

### Cited Findings
- **[Confirmed]** Winners pattern: storytelling and gamification won (Space Travelers, Best Storytelling; Shelter in Space, Best Mission Concept with an analog-mission narrative). — [2021 winners](https://www.spaceappschallenge.org/blog/meet-the-2021-global-winners/); [Shelter in Space](https://covid19.spaceappschallenge.org/challenges/covid-challenges/isolation-solution/teams/shelter-in-space/project)
- **[Confirmed]** Judges weight NASA data as "a core component… rather than a superficial addition" under Relevance, and require scientific soundness under Validity. — [Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)
- **[Confirmed]** Typical 2026 weakness, simulated data and simplified thresholds: AstroPulse states "All astronauts and readings are simulated. Thresholds are simplified for demonstration and are not medical advice." It mixes "clinical safe ranges for each indicator" with a personal EWMA baseline. — [AstroPulse repo](https://github.com/borgil0926/astropulse-health-monitor)
- **[Confirmed]** Typical 2026 weakness, AI framing: AstroPulse brands itself an "offline AI doctor" and gives a "CAN WAIT / ACT NOW" decision with "pharmacy-aware treatment". CheeseOS offers voice symptom reporting with "immediate, autonomous feedback". AURA-EIMO is framed as a "Clinical Decision Support System". — [AstroPulse](https://github.com/borgil0926/astropulse-health-monitor); [CheeseOS](https://github.com/isabelacode/cheeseOS); [GitHub topic listing (AURA-EIMO)](https://github.com/topics/space-apps-challenge?o=desc&s=updated)
- **[Confirmed]** Teams were confused about the NASA-data requirement because the resources are web pages, not datasets. — [Discussion #1994](https://github.com/nasa/spaceapps/discussions/1994); [Discussion #2010 title: "Where can I find the data for this challenge"](https://github.com/nasa/spaceapps/discussions/2010)
- **[Confirmed]** The best 2026 competitors already carry explicit "not a medical device, does not diagnose" disclaimers (RAKIA) and "SIMULATED DATA" labelling. — [RAKIA](https://github.com/jeswinbenedict/RAKIA)

### Inferences
- **[Inferred]** Common weaknesses to exploit in a pitch:
  1. Invented or "simplified" population thresholds presented with color bands as if clinical.
  2. LLM-generated advice that sounds like diagnosis or treatment ("AI doctor", "act now", drug recommendations), which judges may score down on Validity.
  3. NASA HRP cited only in a references list.
  4. No offline story, or "offline" meaning only that the LLM runs locally.
  5. Communication delay mentioned but not modeled in the UI.
  6. Behavioral health reduced to a mood slider.
- **[Inferred]** Health7's specific differentiators against this field:
  - Thresholds labelled "Demonstration rule" *on screen*, not only in a disclaimer.
  - No LLM in the decision path, so "informs and refers" holds by design.
  - A reaction test explicitly modeled on the ISS Reaction Self Test, with the source cited.
  - A live NASA DONKI space-weather card with an offline cache, which is real NASA data rather than simulated vitals.
  - The 17 HRP risks mapped on the body figure.

  Some of these overlap with AstroPulse (body map with HRP risks, personal baseline, outbox with delay) and RAKIA (personal baseline, explainable alerts, store-and-forward, reaction tests), so the pitch must stress transparency and honesty of the rules rather than claiming the features as unique.

### Gaps
- I have no judge feedback or scoring sheets from past health-related submissions, so the weaknesses above are inferred from submissions' self-descriptions, not from judges' comments.

## Q5. Public 2026 submissions for this challenge (as of 2026-11-14, mid-hackathon)

### Takeaway
Several well-engineered 2026 entries are already public. The two closest to Health7 are **RAKIA**, which is offline-first with personal baselines, explainable alerts, store-and-forward sync, check-ins and reaction tests, and **AstroPulse**, which has an interactive body map with the 17 HRP risks, a personal EWMA baseline plus clinical ranges, an outbox with real signal delay, and an offline LLM. Health7 is not alone in its core concept, so its edge must come from the transparency of its rules, the absence of diagnosis or LLM claims, its real NASA DONKI data and the clarity of its pitch.

### Cited Findings

**RAKIA** (team at VIT-AP University, Amaravati, India)
- **[Confirmed]** Tagline: "Offline-first, explainable astronaut health intelligence for long-duration space missions." "It compares each reading with that astronaut's own baseline, explains every alert in plain language, and keeps working when contact with Earth is delayed or lost." — [RAKIA repo](https://github.com/jeswinbenedict/RAKIA)
- **[Confirmed]** Stated differentiators:
  - "Two references for every reading": the personal baseline plus mission context (phase, exercise, sleep shift, workload).
  - A deterministic C core, `librakia`, compiled natively and to WebAssembly.
  - A hash-chained, append-only ledger with "Store-and-forward sync [that] shows the crew exactly what the ground has received".
  - Alerts that answer "what changed, by how much, since when, from which readings, why it matters, and what to do next".
  - A "closed self-check loop".
  - Crew-controlled privacy for behavioral and mood data.
  - A "simulation firewall" that labels data "SIMULATED DATA".
  — [RAKIA repo](https://github.com/jeswinbenedict/RAKIA)
- **[Confirmed]** Disclaimer: "RAKIA is research software. It is not a medical device, it does not diagnose, and its anomaly detection is experimental and not clinically validated." — [RAKIA repo](https://github.com/jeswinbenedict/RAKIA)
- **[Confirmed]** Stack and status: Flutter (web, Android, iOS, desktop), C/C++, PostgreSQL with row-level security, Firebase Auth, Cloudflare. Topics include wearables and explainable-ai. Commit history mentions check-ins and reaction tests ("Check-ins, reaction tests and simulated data are never sent"). Development started around Nov 5, 2026, well before the hackathon weekend. — [RAKIA repo](https://github.com/jeswinbenedict/RAKIA)
- **[Confirmed, with a discrepancy]** RAKIA's README names its challenge "Astronaut Biosecurity: Developing a Space Health Monitoring System for Long-Duration Missions", not the official title. — [RAKIA repo](https://github.com/jeswinbenedict/RAKIA). **[Inferred]** This may be a local-event or team paraphrase; the official title is on the [challenge page](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/).

**AstroPulse** (borgil0926)
- **[Confirmed]** "offline AI doctor + health monitoring for astronauts. Answers 'can this wait for Earth?' with no internet." — [AstroPulse repo](https://github.com/borgil0926/astropulse-health-monitor)
- **[Confirmed]** Features:
  - A crew dashboard for four astronauts with a 0-100 health score and sparklines for 11 indicators.
  - An interactive body map ("brain, inner ear, heart, lungs, immune system, muscles, bones or the radiation halo") that shows "NASA risks".
  - Two-layer detection: "clinical safe ranges" plus a personal "exponentially weighted baseline per astronaut".
  - Alerts with persistence filtering and signal delay.
  - A gamified daily routine with 8 measurements, XP, streaks and badges.
  - Mission control across ISS, Orion, lunar base, Mars transit and Mars base, tracking radiation against "NASA's 600 mSv career limit" and estimated bone loss.
  - JSON/CSV report for flight surgeons.
  - Demo event injection (for example a solar particle event or fever).
  - A "Learn" section covering "the 5 hazards, the 17 HRP risks".
  - An outbox: "sent when the link is available (or queued during a blackout); the flight surgeon's reply arrives after the real delay".
  - A voice companion robot, "Pip".
  - An optional local LLM via Ollama with BM25 retrieval over "174 passages from NASA Human Research Program pages"; "The language model never makes the decision".
  — [AstroPulse repo](https://github.com/borgil0926/astropulse-health-monitor)
- **[Confirmed]** Disclaimer: "All astronauts and readings are simulated. Thresholds are simplified for demonstration and are not medical advice." — [AstroPulse repo](https://github.com/borgil0926/astropulse-health-monitor)

**CheeseOS** (isabelacode)
- **[Confirmed]** "a health assistant for astronauts… features an interactive 3D body model, allowing astronauts to report symptoms via voice and receive immediate, autonomous feedback." Next.js and TypeScript. The README contents were not retrievable. — [CheeseOS repo](https://github.com/isabelacode/cheeseOS); [GitHub topic listing](https://github.com/topics/space-apps-challenge?o=desc&s=updated)

**AURA-EIMO**
- **[Confirmed]** "Autonomous Health Monitoring & Clinical Decision Support System for Astronauts on Deep Space Missions (NASA Space Apps Challenge 2026)." Repo URL not captured. — [GitHub topic listing](https://github.com/topics/space-apps-challenge?o=desc&s=updated)

**Project AEGIS** (YouTube)
- **[Confirmed]** "an autonomous astronaut health-monitoring concept designed for the NASA Space Apps Challenge 2026". — [YouTube](https://www.youtube.com/watch?v=t_SJeoA13Pk)

**Realigns Inc "AstraHealth"**
- **[Confirmed, from a snippet only]** Facebook post title: "Realigns Inc's AstraHealth to develop offline health monitoring…". The same company's team "The Astros" was a 2024 Global Nominee. — [Facebook post](https://www.facebook.com/realigns/posts/realigns-inc-is-officially-competing-in-the-2026-nasa-space-apps-challenge-under/1784175343381959/)

**2026 team pages on spaceappschallenge.org** (descriptions mostly just repeat the challenge text)
- **[Confirmed]** BioTrack: "Building an interactive dashboard using Python, Bolt, and Framer to track how astronauts' health risks compound during long missions." — [BioTrack](https://www.spaceappschallenge.org/2026/find-a-team/biotrack/)
- **[Confirmed]** bkk.sys: "We are building the AI and Cloud infrastructure for the Astronaut Health Monitoring challenge. Our mission is simple: construct an offline-first, …" — [bkk.sys](https://www.spaceappschallenge.org/2026/find-a-team/bkksys/)
- **[Confirmed]** Ares Core: "helps crew members track vital signs, and behavioral health problems." — [Ares Core](https://www.spaceappschallenge.org/2026/find-a-team/ares-core/)
- **[Confirmed]** Team pages for this challenge with no project details captured: [AstroCare](https://www.spaceappschallenge.org/2026/find-a-team/astrocare1/), [astro health](https://www.spaceappschallenge.org/2026/find-a-team/astro-health/), [aeris](https://www.spaceappschallenge.org/2026/find-a-team/aerris/), [Project Horizons](https://www.spaceappschallenge.org/2026/find-a-team/project-horizons/), [algorithm 0.1](https://www.spaceappschallenge.org/2026/find-a-team/algorithm-01/), [Astrocognition](https://www.spaceappschallenge.org/2026/find-a-team/astrocognition/), [ASTRA Health](https://www.spaceappschallenge.org/2026/find-a-team/astra-health/). Full list: [Teams tab](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/?tab=teams)
- **[Confirmed]** A repo of uncertain year, "Astronaut Health Monitoring System" (Madhumitha104): "continuous automated health monitoring to detect anomalies early". — [GitHub](https://github.com/Madhumitha104/Astronaut-Health-Monitoring-System)
- **[Confirmed]** Participants' interest in Flutter, AI/ML and dashboards for this challenge (team-seeking posts). — [Discussion #1799](https://github.com/nasa/spaceapps/discussions/1799); [Discussion #1873](https://github.com/nasa/spaceapps/discussions/1873)

### Inferences
- **[Inferred]** Comparison of Health7 with the strongest public 2026 entries:

  | Feature | RAKIA | AstroPulse | Health7 |
  |---|---|---|---|
  | Personal baseline | Yes | Yes (EWMA) | Yes |
  | Clinical/population ranges | No (context-aware) | Yes | No ("Demonstration rule" shown) |
  | Offline-first | Yes (SQLite/OPFS) | Yes (+ local LLM) | Yes |
  | Ground report + delay queue | Store-and-forward ledger | Outbox with real delay | "Saved for downlink" queue |
  | Body figure linked to HRP risks | Not stated | Yes (17 risks in Learn) | Yes (17 risks) |
  | Behavioral check-in + reaction test | Yes (check-ins, reaction tests) | Sleep/mood logs | Yes (ISS RST-inspired) |
  | Real NASA live data | Not stated | No (simulated; HRP text for RAG) | DONKI live + offline copy |
  | LLM / "AI doctor" | No | Yes | No |
  | Diagnosis stance | "does not diagnose" | "not medical advice" but CAN WAIT/ACT NOW decisions | "informs and refers" |

- **[Inferred]** Health7's most defensible differentiators:
  1. A *live, real NASA dataset* (DONKI) integrated into the health context, which addresses the "data as core component" criterion where others use only simulated vitals.
  2. Rules shown on screen and labelled "Demonstration rule", which is stricter honesty than the others' footnote disclaimers.
  3. No LLM making or wording decisions, which avoids the "AI doctor" validity risk.
  4. The reaction test explicitly tied to the ISS Reaction Self Test.
- **[Inferred]** Health7's risks against this field:
  - RAKIA's engineering depth (tests, hash-chain, multi-platform) and AstroPulse's breadth (mission scenarios, radiation dose against 600 mSv, demo event injection, voice companion) may outshine Health7 on Creativity and Presentation unless the demo tells a tight crew-day story.
  - Personal baseline, body map and delay-aware outbox are *not unique*.

### Gaps
- Final 2026 project submissions, local winners and global nominees were not yet public: the hackathon is in progress on 2026-11-14, and global winners are typically announced months later.
- I could not read CheeseOS's README, find AURA-EIMO's repo URL, or see project details on most spaceappschallenge.org team pages (the Project tab is likely empty until submission).
- I did not search Devpost; Space Apps submissions are made on spaceappschallenge.org, so Devpost coverage is likely minimal (inferred).
