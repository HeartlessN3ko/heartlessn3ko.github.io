const SRX_ARCHIVE_LOCAL_BASE =
  "https://raw.githubusercontent.com/HeartlessN3ko/realm-assets/main/";
const SRX_ARCHIVE_REMOTE_BASE =
  "https://raw.githubusercontent.com/HeartlessN3ko/realm-assets/main/";

function srxAsset(path, alt) {
  const encoded = encodeURI(path);
  return {
    path,
    alt,
    local: SRX_ARCHIVE_LOCAL_BASE + encoded,
    remote: SRX_ARCHIVE_REMOTE_BASE + encoded,
  };
}

window.SRX_PUBLIC_ARCHIVE = {
  updated: "June 29, 2026",
  currentEra: "Third Age, 3120 CE",
  directories: [
    {
      id: "knowledge",
      label: "Realm Knowledge",
      description: "World history, locations, factions, institutions, and public civic records.",
      href: "knowledge/",
      image: srxAsset("maps/region-map-of-terra.png", "Regional map of Terra."),
    },
    {
      id: "bios",
      label: "Public Biographies",
      description: "Public-facing lives and legacies of notable people recorded by SRX.",
      href: "bios/",
      image: srxAsset("npc/arthas-raiku.png", "Official portrait of President Arthas Raiku."),
    },
    {
      id: "dossiers",
      label: "SRX Dossiers",
      description: "Structured personnel extracts, memorial files, and restricted record notices.",
      href: "dossiers/",
      image: srxAsset("logos/SRX-Logo-New.png", "SRX public archive mark."),
    },
  ],
  categories: [
    {
      id: "realm-overview",
      label: "Realm Overview",
      description:
        "Public-facing records on Terra, the Rift, Midgar, and the current age.",
    },
    {
      id: "atlas",
      label: "Atlas",
      description:
        "Mapped locations, transit zones, power centers, and arrival-facing destinations.",
    },
    {
      id: "factions",
      label: "Factions",
      description:
        "Institutional summaries of the powers currently shaping life in the Realm.",
    },
    {
      id: "dossiers",
      label: "Dossiers",
      description:
        "Approved personnel extracts, memorials, and notable figures known to SRX records.",
    },
    {
      id: "historical-record",
      label: "Historical Record",
      description:
        "Locked milestones, public memory, and events that still shape present policy.",
    },
  ],
  records: [
    {
      id: "the-realm",
      directories: ["knowledge"],
      category: "realm-overview",
      title: "The Realm",
      subtitle: "A multiverse convergence centered on Terra",
      classification: "Public Record",
      image: srxAsset(
        "maps/region-map-of-terra.png",
        "Regional map of Terra used in SRX public archive displays."
      ),
      summary:
        "The Realm is a multiversal convergence point centered on Terra. When dimensions collapse, fold, or collide, the Rift carries displaced populations across worlds.",
      body: [
        "Terra is the primary inhabited world at the center of this convergence. Not every arrival comes through violence, but every interdimensional arrival into Midgar is processed through an SRX-controlled system.",
        "The Gateway is the most visible modern answer to the old chaos of raw Rift events. For citizens of Midgar, it is infrastructure. For refugees, it is usually the first threshold between one life and another.",
      ],
      facts: [
        ["World Center", "Terra"],
        ["Capital Power", "Midgar City"],
        ["Arrival Authority", "SRX"],
        ["Current Era", "Third Age, 3120 CE"],
      ],
      highlights: [
        "Terra natives travel normally; interdimensional arrivals are processed.",
        "SRX controls entry, registration, and limiter assignment inside Midgar.",
        "The Realm contains old civilizations, modern states, and post-Rift hybrid societies.",
      ],
      related: ["third-age", "gateway-station", "midgar"],
      source: "data/lore/world_lore.md",
    },
    {
      id: "third-age",
      directories: ["knowledge"],
      category: "realm-overview",
      title: "The Third Age",
      subtitle: "The present era of recovery, control, and renewed expansion",
      classification: "Public Record",
      image: srxAsset(
        "oracle/historical/02-sector0-construction-ifield.png",
        "Sector 0 reconstruction and I-Field expansion during the transition toward the Third Age."
      ),
      summary:
        "The Third Age opens in 3120 CE after reconstruction, political consolidation, and the formal rise of the Shinra Kingdom.",
      body: [
        "The Realm has already survived the Great Rift, the long reconstruction that followed, the SRX-RIA war, and the Battle for Eternium. The Third Age inherits all of that history at once.",
        "Publicly, the age is defined by stabilization, controlled arrivals, renewed institutional power, and a sense that the world is finally organized enough to be studied instead of merely survived.",
      ],
      facts: [
        ["Current Year", "3120 CE"],
        ["Seat of Power", "Shinra Tower, Sector 0"],
        ["Military Arm", "SRX"],
        ["Civilian Crown", "Shinra Kingdom"],
      ],
      highlights: [
        "Infrastructure is rebuilt, but trust is not fully restored.",
        "The Third Age follows the reconstruction period and formalizes the Kingdom.",
        "Public memory of the Battle for Eternium remains strong even where details are sealed.",
      ],
      related: ["shinra-kingdom", "srx", "battle-for-eternium"],
      source: "data/lore/world_lore.md",
    },
    {
      id: "midgar",
      directories: ["knowledge"],
      category: "atlas",
      title: "Midgar",
      subtitle: "Capital of the Shinra Kingdom",
      classification: "Public Record",
      image: srxAsset(
        "maps/midgar-overhead.png",
        "Overhead view of Midgar and its sector plate structure."
      ),
      summary:
        "Midgar is the capital of the Shinra Kingdom and the most controlled city in the Realm's eastern political sphere.",
      body: [
        "The city is structured around eight sectors arranged around Sector 0 and the central tower. Odd-numbered sectors occupy the lower plate under open sky, while even sectors sit within the upper structure.",
        "Midgar is both civic capital and institutional machine: transit, surveillance, intake, calibration, housing, and public order all pass through SRX-backed systems.",
      ],
      facts: [
        ["Continent", "East-Erdanis"],
        ["Population", "~350 million"],
        ["Sector Center", "Sector 0"],
        ["Controlling Authority", "Shinra Kingdom / SRX"],
      ],
      highlights: [
        "Every arrival is issued an SRX Monitor Device.",
        "Control is absolute in Sector 0 and softens outward by district.",
        "Midgar presents itself as orderly, modern, and difficult to escape from unnoticed.",
      ],
      related: ["shinra-tower", "gateway-station", "residential-district"],
      source: "data/srx_database/locations/MIDGAR.md",
    },
    {
      id: "gateway-station",
      directories: ["knowledge"],
      category: "atlas",
      title: "Gateway Station",
      subtitle: "The interdimensional intake threshold for Midgar",
      classification: "Limited Public Briefing",
      image: srxAsset(
        "locations/onboarding_room.png",
        "Clinical SRX intake and onboarding environment."
      ),
      summary:
        "Gateway Station is the processing point for Rift arrivals entering the Shinra Kingdom through SRX-controlled channels.",
      body: [
        "The intake hall within the Sector 0 complex is designed around processing lanes, biometric registration, and power assessment. SRX staff and ARIA-L units normalize the process, but the hierarchy is unmistakable.",
        "Every arrival is examined, registered, assigned a dampening level under the Limiter Protocol, and directed into the controlled housing and orientation flow that follows.",
      ],
      facts: [
        ["Function", "Interdimensional intake"],
        ["Authority", "SRX, absolute"],
        ["Daily Volume", "~500 portal travelers across the Realm"],
        ["Citizen Access", "Arrival-facing only"],
      ],
      highlights: [
        "Terra natives do not need the Gateway for ordinary travel.",
        "Intake is both humanitarian processing and institutional control.",
        "Portal details remain partly restricted even when the hall itself is publicly known.",
      ],
      related: ["the-realm", "midgar", "residential-district"],
      source: "data/srx_database/locations/GATEWAY_STATION.md",
    },
    {
      id: "shinra-tower",
      directories: ["knowledge"],
      category: "atlas",
      title: "Shinra Tower",
      subtitle: "Seat of the Kingdom and headquarters of SRX",
      classification: "Limited Public Briefing",
      image: srxAsset(
        "reference/shinra-tower-info-shots.png",
        "Information display showing Shinra Tower and major internal zones."
      ),
      summary:
        "Shinra Tower dominates Sector 0 and serves as the administrative, strategic, and symbolic heart of Midgar.",
      body: [
        "The tower contains public floors, restricted SRX operations, research zones, and the presidential office. It is less a building than a vertical state apparatus.",
        "Its grounds also function as civic theater. Memorial statues and controlled access routes shape how the Kingdom remembers its builders and its fallen.",
      ],
      facts: [
        ["Location", "Sector 0, Midgar"],
        ["Public Floors", "1-45"],
        ["Executive Floors", "66-70"],
        ["Current Office", "President Arthas Raiku, Floor 70"],
      ],
      highlights: [
        "SRX control within the tower is total.",
        "Deep sublevels contain restricted research and containment zones.",
        "Public-facing exhibits and memorials coexist with sealed internal sections.",
      ],
      related: ["midgar", "shinra-kingdom", "arthas-raiku"],
      source: "data/srx_database/locations/SHINRA_TOWER.md",
    },
    {
      id: "residential-district",
      directories: ["knowledge"],
      category: "atlas",
      title: "Residential District",
      subtitle: "Sector 5 civilian housing and refugee resettlement zone",
      classification: "Public Record",
      image: srxAsset(
        "locations/dorm_lobby.png",
        "Residential Lobby interior in Midgar's managed housing district."
      ),
      summary:
        "Sector 5 is where many newly processed arrivals first encounter ordinary life in Midgar.",
      body: [
        "The district is deliberately calm: dorms, community commons, soft lighting, and low visible urgency. SRX presents this zone as support rather than enforcement, though the system remains tightly managed.",
        "For many refugees, the Residential Lobby is the first place where Midgar feels like a city instead of a processing mechanism.",
      ],
      facts: [
        ["Sector", "5"],
        ["Plate", "Lower plate"],
        ["Tone", "Calm, managed, community-facing"],
        ["Access", "Unlocked after onboarding completion"],
      ],
      highlights: [
        "Low crime and soft presentation are part of the design.",
        "Community life and surveillance are intentionally blended.",
        "SRX considers a settled population a tracked population.",
      ],
      related: ["gateway-station", "midgar", "srx"],
      source: "data/srx_database/locations/RESIDENTIAL_DISTRICT.md",
    },
    {
      id: "cameron-city",
      directories: ["knowledge"],
      category: "atlas",
      title: "Cameron City",
      subtitle: "RIA capital and rival sovereign center",
      classification: "Limited Public Briefing",
      image: srxAsset(
        "oracle/grand-library-seed/05-brochure-cameron-city.png",
        "SRX database visual survey of Cameron City."
      ),
      summary:
        "Cameron City is the capital of the Realm Inspection Agency and the strongest formal counterweight to Shinra power.",
      body: [
        "Located on the Wasteland Continent, Cameron City is dense, sovereign, and politically sharp-edged. It houses veterans, refugees outside Shinra jurisdiction, and a great deal of information SRX would rather catalog than trust.",
        "The ceasefire with SRX still holds, but Cameron remains one of the clearest reminders that the Realm never became a single uncontested state.",
      ],
      facts: [
        ["Territory", "RIA sovereign ground"],
        ["Population", "60M+ in current records"],
        ["Current Head", "Barron Nevermore"],
        ["Status", "Cold peace under treaty"],
      ],
      highlights: [
        "Outside Shinra jurisdiction.",
        "A center of survival politics, forbidden data, and guarded autonomy.",
        "One of the most important cities in any serious map of postwar Terra.",
      ],
      related: ["ria", "battle-for-eternium", "shinra-kingdom"],
      source: "data/srx_database/locations/CAMERON_CITY.md",
    },
    {
      id: "eternium-site",
      directories: ["knowledge"],
      category: "atlas",
      title: "Tartan Crater / Eternium Deposit",
      subtitle: "The known major Eternium site and final Second Age flashpoint",
      classification: "Restricted Historical Summary",
      image: srxAsset(
        "oracle/historical/08-battle-for-eternium-excavation.png",
        "Eternium excavation front during the Battle for Eternium."
      ),
      summary:
        "Tartan Crater houses the Realm's only known major deposit of Eternium, a crystalline ore capable of channeling extraordinary magical potential.",
      body: [
        "The deposit formed beneath Tartanalia after millennia of sustained magical use. Once the region's barrier fell, the site became strategically visible and politically impossible to ignore.",
        "The public knows the Battle for Eternium as a defining conflict of the late Second Age. The full military story remains sealed, but the site still carries the weight of what happened there.",
      ],
      facts: [
        ["Region", "Tartanalia, northern Tartan Islands"],
        ["Known Resource", "Eternium"],
        ["Barrier Fall", "3013 CE"],
        ["Conflict Window", "3098-3108 CE"],
      ],
      highlights: [
        "Ancient elves knew it as the Eternium Crystal.",
        "Public memory preserves the event more clearly than its internal details.",
        "Even redacted histories treat the site as a turning point.",
      ],
      related: ["battle-for-eternium", "weyr-of-dragonlords", "the-realm"],
      source: "data/srx_database/locations/ETERNIUM.md",
    },
    {
      id: "srx",
      directories: ["knowledge"],
      category: "factions",
      title: "SRX",
      subtitle: "Shinra Robotics and Xenogenetics",
      classification: "Public Record",
      image: srxAsset(
        "logos/SRX-Logo-New.png",
        "SRX logo used in public archive panels."
      ),
      summary:
        "SRX is the military and technological arm of the Shinra Kingdom and the most visible institutional force in Midgar.",
      body: [
        "It governs intake, public infrastructure, robotics, power calibration, medical research, and xenogenetic oversight. SRX is not presented to citizens as charity. It is presented as capability.",
        "Its official line is simple: no one should be left defenseless. In practice, that promise always arrives with hierarchy, surveillance, and control.",
      ],
      facts: [
        ["Full Name", "Shinra Robotics and Xenogenetics"],
        ["Former Name", "Shinra Resurrected X"],
        ["Current Command", "President Arthas Raiku"],
        ["Primary Seat", "Sector 0, Midgar"],
      ],
      highlights: [
        "Controls Gateway intake and the Limiter Protocol.",
        "Sets the pace in military technology, medicine, and engineered systems.",
        "Public record omits some of SRX's older internal history by design.",
      ],
      related: ["shinra-kingdom", "midgar", "gateway-station"],
      source: "data/srx_database/factions/SRX.md",
    },
    {
      id: "shinra-kingdom",
      directories: ["knowledge"],
      category: "factions",
      title: "Shinra Kingdom",
      subtitle: "The governing body of Midgar and its surrounding territories",
      classification: "Public Record",
      image: srxAsset(
        "logos/shinra-gunmetal-logo.png",
        "Gunmetal crest used for the Shinra Kingdom."
      ),
      summary:
        "The Shinra Kingdom is the state structure around Midgar, with SRX functioning as its military-technological arm.",
      body: [
        "The Kingdom evolved out of the former Republic of Shinra during reconstruction. The presidency is passed by succession rather than election, binding bloodline, continuity, and state command into one chain of authority.",
        "In the public sphere, the Kingdom projects order, restoration, and confidence. Beneath that surface, it still carries the political residue of the Second Age.",
      ],
      facts: [
        ["Capital", "Midgar City"],
        ["Current President", "Arthas Raiku"],
        ["Vice President", "Alexander Raiku"],
        ["Seat of Government", "Shinra Tower"],
      ],
      highlights: [
        "The President commands both crown and SRX.",
        "The Vice President governs the civilian branch.",
        "The rebuilt state is polished, but not universally trusted.",
      ],
      related: ["srx", "arthas-raiku", "alexander-raiku"],
      source: "data/srx_database/factions/SHINRA_KINGDOM.md",
    },
    {
      id: "ria",
      directories: ["knowledge"],
      category: "factions",
      title: "RIA",
      subtitle: "Realm Inspection Agency",
      classification: "Limited Public Briefing",
      image: null,
      imageStatus: "No public image assigned in the SRX database.",
      summary:
        "The RIA is the historic counterweight to Shinra power and remains the dominant force in Cameron City.",
      body: [
        "Once the Realm's leading power, the RIA now operates as a rival sovereign agency whose ceasefire with SRX has held since 3088 CE.",
        "Public understanding of the RIA is intentionally incomplete: enough to recognize its importance, not enough to feel comfortable about what else it may be doing beyond the treaty line.",
      ],
      facts: [
        ["Full Name", "Realm Inspection Agency"],
        ["Primary Territory", "Cameron City"],
        ["Historic Leader", "Barron Nevermore"],
        ["Stance Toward SRX", "Cold peace under treaty"],
      ],
      highlights: [
        "The RIA remains central to any honest political map of the Realm.",
        "Its peace with SRX is functional, not warm.",
        "Public knowledge stops well short of RIA internal capabilities.",
      ],
      related: ["cameron-city", "battle-for-eternium", "srx"],
      source: "data/srx_database/factions/RIA.md",
    },
    {
      id: "weyr-of-dragonlords",
      directories: ["knowledge"],
      category: "factions",
      title: "Weyr of Dragonlords",
      subtitle: "Independent order seated at DragonsKeep",
      classification: "Limited Public Briefing",
      image: null,
      imageStatus: "No public image assigned in the SRX database.",
      summary:
        "The Weyr of Dragonlords is an independent order bonded to dragon souls and seated outside Kingdom authority at DragonsKeep.",
      body: [
        "DragonsKeep functions as sanctuary, treaty ground, and sovereign threshold. It is explicitly not Shinra territory, and access is permission-based.",
        "Nexa Rei and the Weyr represent one of the clearest reminders that not every old power in the Realm answers to Midgar, even when Midgar would prefer it did.",
      ],
      facts: [
        ["Sanctuary", "DragonsKeep Island"],
        ["Current Leader", "Nexa Rei"],
        ["Political Status", "Independent treaty zone"],
        ["Access", "By special clearance or invitation"],
      ],
      highlights: [
        "The Weyr answers to no outside faction.",
        "Its neutrality has been enforced even during tense multi-faction encounters.",
        "DragonsKeep remains symbolically larger than its formal territory.",
      ],
      related: ["eternium-site", "battle-for-eternium", "the-realm"],
      source: "data/srx_database/factions/WEYR_OF_DRAGONLORDS.md",
    },
    {
      id: "arthas-raiku",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Arthas Raiku",
      subtitle: "President of the Shinra Kingdom",
      classification: "Approved Public Extract",
      image: srxAsset(
        "npc/arthas-raiku.png",
        "Official portrait of Arthas Raiku."
      ),
      summary:
        "Arthas Raiku is the current President of the Shinra Kingdom and direct commander of SRX.",
      body: [
        "At eighteen, he became the youngest president in recorded SRX history. Publicly, he represents institutional continuity more than personal spectacle.",
        "His leadership profile is marked by precision, confidence, and strong commitment to established systems. To supporters, that reads as stability. To critics, it reads as distance.",
      ],
      facts: [
        ["Birth Year", "3102 CE"],
        ["Current Age", "18"],
        ["Role", "President and Commander-in-Chief"],
        ["Seat", "Shinra Tower, Floor 70"],
      ],
      highlights: [
        "Youngest president in recorded SRX history.",
        "Commands both state and military authority.",
        "Public records emphasize discipline, continuity, and control.",
      ],
      related: ["shinra-kingdom", "shinra-tower", "alexander-raiku"],
      source: "data/srx_database/dossiers/ARTHAS_RAIKU_DOSSIER.md",
    },
    {
      id: "alexander-raiku",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Alexander Raiku",
      subtitle: "Vice President and civilian administrator",
      classification: "Approved Public Extract",
      image: null,
      imageStatus: "No public image assigned in the SRX database.",
      summary:
        "Alexander Raiku governs the civilian branch of the Shinra Kingdom and remains one of the principal surviving architects of its reconstruction era.",
      body: [
        "Where Arthas is the visible present, Alexander often reads as the bridge between eras. His public profile is administrative, diplomatic, and structurally focused.",
        "He is closely tied to the transformation of Shinra's state form from republic to kingdom, and his continued presence stabilizes succession in the eyes of many citizens.",
      ],
      facts: [
        ["Birth Year", "3080 CE"],
        ["Current Age", "40"],
        ["Current Role", "Vice President of the Shinra Kingdom"],
        ["Political Domain", "Civilian administration"],
      ],
      highlights: [
        "Oversaw major political transition during reconstruction.",
        "Functions as civilian counterweight to SRX command structure.",
        "A foundational modern figure in the Kingdom's public identity.",
      ],
      related: ["arthas-raiku", "shinra-kingdom", "zoey-cinclaire"],
      source: "data/srx_database/dossiers/ALEXANDER_RAIKU_DOSSIER.md",
    },
    {
      id: "zoey-cinclaire",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Zoey Cinclaire",
      subtitle: "Founding Turks member and memorialized reconstruction leader",
      classification: "Memorial Record",
      image: srxAsset(
        "oracle/personnel/portraits/zoey-cinclaire-city.png",
        "Zoey Cinclaire in Midgar, matched to her SRX dossier portrait archive."
      ),
      summary:
        "Zoey Cinclaire remains one of the most remembered names from the reconstruction generation of SRX personnel.",
      body: [
        "Originally a founding Turks recruit, she later moved through urban development, acting command responsibilities, and major reconstruction-era leadership.",
        "By the opening of the Third Age she was already gone, but her memorial status inside Shinra Tower keeps her name alive in the institutional memory of Midgar.",
      ],
      facts: [
        ["Status", "Deceased, 3118 CE"],
        ["Generation", "4"],
        ["Known Roles", "Turks member, Urban Development, Acting Director"],
        ["Memorial", "East Garden statue, Shinra grounds"],
      ],
      highlights: [
        "Associated with diplomacy, leadership, and public-facing SRX coordination.",
        "Memorialized as part of the generation that prepared Midgar for the Third Age.",
        "One of the most accessible faces of older SRX history for new arrivals.",
      ],
      related: ["shinra-tower", "alexander-raiku", "midgar"],
      source: "data/srx_database/dossiers/ZOEY_CINCLAIRE_DOSSIER.md",
    },
    {
      id: "xeria-silveredge",
      directories: ["dossiers"],
      category: "dossiers",
      title: "Xeria Silveredge",
      subtitle: "Restricted abstract: deep-cover SRX operative",
      classification: "Restricted Abstract",
      image: null,
      imageStatus: "Portrait sealed. Database record is Class S - Top Secret.",
      summary:
        "SRX records acknowledge Xeria Silveredge as one of the organization's most significant intelligence operatives, though most of her file remains sealed.",
      body: [
        "Public-facing release material confirms only the broad shape: a cross-generational operative tied to deep cover work, multiple aliases, and long-running classified assignments.",
        "The existence of a restricted abstract on a public terminal is itself a signal. Some names remain visible not because they are fully known, but because their absence would be louder.",
      ],
      facts: [
        ["Known Aliases", "Xia, Ayame Yamamoto, Jynx"],
        ["Status", "Active, location classified"],
        ["Role Family", "Deep-cover intelligence"],
        ["Release Status", "Partial public abstract only"],
      ],
      highlights: [
        "Most operational details remain sealed.",
        "Presence in public archive reflects historical importance, not open access.",
        "SRX acknowledges the record while withholding the person.",
      ],
      related: ["srx", "alexander-raiku", "ria"],
      source: "data/srx_database/dossiers/XERIA_SILVEREDGE_DOSSIER.md",
    },
    {
      id: "great-rift",
      directories: ["knowledge"],
      category: "historical-record",
      title: "The Great Rift",
      subtitle: "The world-breaking convergence that changed Terra forever",
      classification: "Public Historical Record",
      image: srxAsset(
        "maps/old-map-of-terra.png",
        "Historic Terra survey map used in Great Rift studies."
      ),
      summary:
        "Around 120 CE, the Rift destabilized the Nexus and permanently reshaped Terra by dragging beings, landscapes, and histories across realities.",
      body: [
        "The event lasted roughly seventy-two hours and altered population, geography, and civilization on a planetary scale. Modern Terra cannot be understood without it.",
        "Much of the Realm's mixed species makeup, political fragmentation, and post-ancient cultural layering begins here.",
      ],
      facts: [
        ["Approximate Date", "~120 CE"],
        ["Known Duration", "~72 hours"],
        ["Historic Result", "Permanent multiversal convergence"],
        ["Scholarly Status", "Cause unknown and likely unknowable"],
      ],
      highlights: [
        "The Great Rift marks the break between ancient and modern Terra.",
        "It seeded the long instability later remembered in war and reconstruction.",
        "No official record claims to know why it happened.",
      ],
      related: ["the-realm", "third-age", "battle-for-eternium"],
      source: "data/lore/world_lore.md",
    },
    {
      id: "treaty-of-ceasefire",
      directories: ["knowledge"],
      category: "historical-record",
      title: "Treaty of Ceasefire",
      subtitle: "The agreement that ended the SRX-RIA war",
      classification: "Public Historical Record",
      image: srxAsset(
        "oracle/historical/09-treaty-of-ceasefire.png",
        "Treaty of Ceasefire signing ceremony from the SRX historical photo database."
      ),
      summary:
        "Signed in 3088 CE, the Treaty of Ceasefire ended the ten-year war between SRX and the RIA and began the Second Age.",
      body: [
        "The treaty did not create friendship. It created a framework strong enough to stop mutual destruction and allow the Realm to keep rebuilding.",
        "Much of modern geopolitics still sits inside the space that treaty carved out: guarded peace, rival sovereignty, and permanent suspicion across the line.",
      ],
      facts: [
        ["Date", "3088 CE"],
        ["Primary Parties", "SRX and RIA"],
        ["Historic Outcome", "End of ten-year war"],
        ["Era Marker", "Beginning of the Second Age"],
      ],
      highlights: [
        "The treaty still structures present relations.",
        "Peace arrived through exhaustion, not trust.",
        "Its political afterimage remains visible in Midgar and Cameron alike.",
      ],
      related: ["ria", "srx", "cameron-city"],
      source: "data/lore/world_lore.md",
    },
    {
      id: "battle-for-eternium",
      directories: ["knowledge"],
      category: "historical-record",
      title: "Battle for Eternium",
      subtitle: "A defining late Second Age conflict with sealed internal details",
      classification: "Restricted Historical Summary",
      image: srxAsset(
        "oracle/historical/08-battle-for-eternium-excavation.png",
        "Eternium excavation front during the Battle for Eternium."
      ),
      summary:
        "The Battle for Eternium is remembered across the Realm as a major conflict that unfolded between 3098 and 3108 CE around the known deposit in Tartanalia.",
      body: [
        "Public records acknowledge its scale and its importance. They do not disclose the full operational or internal details that drove the conflict from within SRX.",
        "Even in redacted form, the battle marks the end of one political order and the beginning of another. Much of the Third Age is built in its shadow.",
      ],
      facts: [
        ["Conflict Window", "3098-3108 CE"],
        ["Core Site", "Tartan Crater / Eternium deposit"],
        ["Public Understanding", "Major war-shaping conflict"],
        ["Internal Detail", "Sealed"],
      ],
      highlights: [
        "The public knows enough to remember it, not enough to narrate it fully.",
        "Eternium remains one of the most politically loaded materials in the archive.",
        "Late Second Age and early reconstruction records repeatedly orbit this event.",
      ],
      related: ["eternium-site", "third-age", "srx"],
      source: "data/srx_database/locations/ETERNIUM.md",
    },
  ],
};
