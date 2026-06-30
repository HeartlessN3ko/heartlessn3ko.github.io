// Curated public-release summaries layered over the internal archive index.
(() => {
  const archive = window.SRX_PUBLIC_ARCHIVE;

  function release(record) {
    const index = archive.records.findIndex(
      (item) => item.id === record.id || (record.source && item.source === record.source)
    );
    if (index >= 0) archive.records.splice(index, 1, record);
    else archive.records.push(record);
  }

  [
    {
      id: "sephiroth-raiku",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Sephiroth Raiku",
      subtitle: "Founder of SRX and architect of modern Shinra",
      classification: "Executive Historical Record",
      image: null,
      imageStatus: "Historic portrait pending archive restoration.",
      summary:
        "Sephiroth Raiku founded the organization that became Shinra Robotics and Xenogenetics and helped establish Shinra Company as a central force in Midgar's recovery.",
      body: [
        "Born Sephiroth Makai, he survived displacement, captivity, and the violence of Silvermoon before finding protection and training within the Silveredge household. Those years shaped a leader who treated security, industry, and personal survival as inseparable concerns.",
        "Raiku later organized Shinra Resurrected X from the remains of an earlier Shin-Ra government. Working with Chaz Asheline and the company's first generation of specialists, he expanded the organization into a source of employment, technology, defense, and political stability throughout Midgar.",
        "His presidency established many of the command structures still used by SRX. His son, Alexander Raiku, continued that public legacy through the civilian government and later executive service.",
      ],
      facts: [
        ["Known Names", "Sephiroth Makai; Sephiroth Raiku"],
        ["Historic Office", "Founder and President"],
        ["Institutional Legacy", "Shinra Company / SRX"],
        ["Public Family Record", "Father of Alexander Raiku"],
      ],
      highlights: [
        "Converted a fragmented security organization into a major civic and technological institution.",
        "Oversaw early expansion in Midgar, including industrial recovery and employment programs.",
        "Operational records involving experimental programs remain outside the public release.",
      ],
      related: ["srx", "alexander-raiku", "shinra-kingdom"],
      source: "The Realm Historical Archive/Rp Post/seph bio.txt",
    },
    {
      id: "alexander-raiku",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Alexander Raiku",
      subtitle: "Vice President and former President of the Republic of Shinra",
      classification: "Executive Public Record",
      image: null,
      imageStatus: "Official portrait pending public archive transfer.",
      summary:
        "Alexander Raiku is one of Shinra's longest-serving public executives, with a record spanning national leadership, reconstruction, diplomacy, and civilian administration.",
      body: [
        "As President of the Republic of Shinra, Raiku guided civilian government through years of political transition and reconstruction. His administration worked to preserve public institutions while SRX rebuilt Midgar's security, infrastructure, and technological capacity.",
        "He now serves as Vice President of the Shinra Kingdom and directs its civilian branch. His long institutional memory and diplomatic experience provide continuity between the republic, the reconstructed state, and the current presidency of his son, Arthas Raiku.",
      ],
      facts: [
        ["Birth Year", "3080 CE"],
        ["Current Office", "Vice President of the Shinra Kingdom"],
        ["Former Office", "President of the Republic of Shinra"],
        ["Public Family Record", "Father of President Arthas Raiku"],
      ],
      highlights: [
        "Oversaw diplomacy, civilian administration, and major reconstruction policy.",
        "Served through the transition from republic to kingdom.",
        "Remains the senior civilian counterweight within Shinra's command structure.",
      ],
      related: ["arthas-raiku", "sephiroth-raiku", "shinra-kingdom"],
      source: "data/srx_database/dossiers/ALEXANDER_RAIKU_DOSSIER.md",
    },
    {
      id: "zoey-cinclaire",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Zoey Cinclaire",
      subtitle: "Founding Turks member and reconstruction leader",
      classification: "Memorial Public Record",
      image: srxAsset(
        "oracle/personnel/portraits/zoey-cinclaire-city.png",
        "Public memorial portrait of Zoey Cinclaire in Midgar."
      ),
      summary:
        "Zoey Cinclaire helped establish the modern Turks and later became one of Shinra's most visible leaders in urban development, diplomacy, and reconstruction.",
      body: [
        "Cinclaire joined SRX in 3102 CE as a member of the founding Turks generation. Her service moved well beyond field operations: she became Assistant Director of Urban Development and repeatedly represented Shinra Company in civic and diplomatic work.",
        "During a prolonged absence in senior leadership, Cinclaire served as Acting Director and helped keep the organization operational. Her work linked security, public administration, and the physical rebuilding of Midgar at a time when all three were under strain.",
        "She died in 3118 CE. Her memorial on the Shinra grounds recognizes both her formal service and the confidence placed in her during some of the company's most unstable years.",
      ],
      facts: [
        ["Service Began", "3102 CE"],
        ["Status", "Deceased, 3118 CE"],
        ["Known Offices", "Turks; Urban Development; Acting Director"],
        ["Memorial", "East Garden, Shinra grounds"],
      ],
      highlights: [
        "Member of the founding modern Turks roster.",
        "Led public coordination and reconstruction programs across Midgar.",
        "Remembered for maintaining institutional continuity during a leadership crisis.",
      ],
      related: ["alexander-raiku", "shinra-tower", "srx"],
      source: "data/srx_database/dossiers/ZOEY_CINCLAIRE_DOSSIER.md",
    },
    {
      id: "xeria-silveredge",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Ayame Silveredge",
      subtitle: "Founding security officer and diplomatic protector",
      classification: "Service History // Public Extract",
      image: srxAsset("npc/Ayame.png", "Public archive portrait of Ayame Silveredge."),
      summary:
        "Ayame Silveredge, also recorded as Xeria Silveredge, served across multiple generations of Shinra security, intelligence, and executive protection.",
      body: [
        "Known publicly by the field name Ayame, Silveredge built her reputation through special operations, protective service, and intelligence work during Shinra's formative years. Her assignments repeatedly placed her near the highest levels of company and state leadership.",
        "Her public record includes service as a diplomatic bodyguard to Alexander Raiku and participation in operations that shaped SRX's early security doctrine. Later covert assignments remain sealed, but her historical role within the institution is widely acknowledged.",
      ],
      facts: [
        ["Public Name", "Ayame Silveredge"],
        ["Archive Name", "Xeria Silveredge"],
        ["Known Service", "Special Operations; Intelligence; Executive Protection"],
        ["Historic Assignment", "Diplomatic protection for Alexander Raiku"],
      ],
      highlights: [
        "Served across several generations of Shinra leadership.",
        "Helped establish early executive-protection and field-intelligence practices.",
        "Current operational details and active assignments are not part of this release.",
      ],
      related: ["alexander-raiku", "sephiroth-raiku", "srx"],
      source: "data/srx_database/dossiers/XERIA_SILVEREDGE_DOSSIER.md",
    },
    {
      id: "db-dossiers-chaz-asheline",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Chaz M. Asheline",
      subtitle: "Founding Director of Scientific Research and Development",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Chaz Asheline was an early SRX executive whose research leadership helped turn Shinra Company into a major technological and industrial power.",
      body: [
        "Asheline worked alongside Sephiroth Raiku during the company's formative period and directed scientific research, weapons development, and advanced-material programs.",
        "His department established foundations later inherited by Professor Drake Strider. Several individual projects remain classified, but Asheline's role in the growth of SRX is part of the recognized institutional record.",
      ],
      facts: [
        ["Historic Office", "Director, Scientific Research and Development"],
        ["Known Specialty", "Weapons and advanced materials"],
        ["Institutional Period", "Founding SRX leadership"],
        ["Recorded Successor", "Professor Drake Strider"],
      ],
      highlights: [
        "Member of Shinra Company's founding executive circle.",
        "Built early scientific and industrial capacity inside SRX.",
        "Specific research programs remain restricted.",
      ],
      related: ["sephiroth-raiku", "db-dossiers-drake-strider", "srx"],
      source: "data/srx_database/dossiers/CHAZ_ASHELINE_DOSSIER.md",
    },
    {
      id: "db-dossiers-drake-strider",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Professor Drake Strider",
      subtitle: "Scientific director, engineer, and medical researcher",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Professor Drake Strider led major SRX scientific and medical programs after succeeding Chaz Asheline in the company's research division.",
      body: [
        "Recruited from the Academy of the Equinox in 3102 CE, Strider brought expertise in robotics, biomechanical engineering, materials science, and medicine to Shinra Company.",
        "His tenure expanded the practical reach of SRX research, supporting both field personnel and civilian reconstruction. Public records credit him with strengthening the technical systems on which modern Midgar depends.",
      ],
      facts: [
        ["Joined SRX", "3102 CE"],
        ["Known Office", "Lead scientific and medical researcher"],
        ["Specialties", "Robotics; biomechanical engineering; medicine"],
        ["Predecessor", "Chaz M. Asheline"],
      ],
      highlights: [
        "Expanded SRX robotics and medical research capacity.",
        "Connected field engineering with civilian reconstruction needs.",
        "Restricted project files are omitted from this service record.",
      ],
      related: ["db-dossiers-chaz-asheline", "srx", "midgar"],
      source: "data/srx_database/dossiers/DRAKE_STRIDER_DOSSIER.md",
    },
    {
      id: "db-dossiers-lenta-kagamine",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Lenta Kagamine",
      subtitle: "Founding Turks systems and investigative specialist",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Lenta Kagamine combined field investigation, systems expertise, and cybernetic integration as a member of the founding modern Turks roster.",
      body: [
        "Kagamine joined SRX in 3102 CE and served in investigative affairs and technical field operations. Her close integration with Shinra systems made her an important bridge between personnel, communications, and the developing ORACLE network.",
        "She also contributed to the practical use and maintenance of biomechanical systems within the field division. Technical vulnerabilities and later restricted operations are omitted from this release.",
      ],
      facts: [
        ["Joined SRX", "3102 CE"],
        ["Division", "Turks / Investigative Affairs"],
        ["Known Specialty", "Systems integration and field investigation"],
        ["Historic Network", "ORACLE-linked operations"],
      ],
      highlights: [
        "Member of the founding modern Turks roster.",
        "Supported the early integration of field personnel with SRX systems.",
        "Sensitive technical specifications remain sealed.",
      ],
      related: ["zoey-cinclaire", "db-dossiers-misaki-promethiae", "srx"],
      source: "data/srx_database/dossiers/LENTA_KAGAMINE_DOSSIER.md",
    },
    {
      id: "db-dossiers-misaki-promethiae",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Misaki Promethiae",
      subtitle: "Founding Turks field-intelligence specialist",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Misaki Promethiae served in the founding modern Turks generation as a tracker, field-intelligence officer, and hostile-environment specialist.",
      body: [
        "Recruited from the Academy of the Equinox in 3102 CE, Promethiae was assigned to operations requiring pursuit, reconnaissance, and survival beyond controlled Shinra territory.",
        "Her service helped define the field standards used by later Turks teams. Specific abilities, mission targets, and current-location records remain outside the public archive.",
      ],
      facts: [
        ["Joined SRX", "3102 CE"],
        ["Division", "Turks / Field Intelligence"],
        ["Known Specialty", "Tracking and hostile-environment operations"],
        ["Previous Institution", "Academy of the Equinox"],
      ],
      highlights: [
        "Member of the founding modern Turks roster.",
        "Helped establish SRX field-intelligence practices.",
        "Operational details remain restricted.",
      ],
      related: ["zoey-cinclaire", "db-dossiers-lenta-kagamine", "srx"],
      source: "data/srx_database/dossiers/MISAKI_PROMETHIAE_DOSSIER.md",
    },
    {
      id: "db-dossiers-tamashii-deathshade",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Tamashii Deathshade",
      subtitle: "Turks commander and later civic leader",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Tamashii Deathshade rose from the founding modern Turks roster to command high-level SRX operations before entering civic leadership at DeathShade Citadel.",
      body: [
        "After joining SRX in 3102 CE, Deathshade became known for command discipline and operational leadership. He eventually served as leader of the Turks and directed assignments central to Shinra security.",
        "His later public record places him in a governance role at DeathShade Citadel, extending his influence beyond company service. Supernatural and medical details in his restricted file are not included here.",
      ],
      facts: [
        ["Joined SRX", "3102 CE"],
        ["Highest SRX Office", "Leader of the Turks"],
        ["Later Service", "Civic leadership, DeathShade Citadel"],
        ["Known Field", "Command and special operations"],
      ],
      highlights: [
        "Commanded the Turks during a formative period of SRX history.",
        "Carried his leadership experience into regional governance.",
        "Restricted medical and operational records remain sealed.",
      ],
      related: ["db-dossiers-drakath-amaranth", "zoey-cinclaire", "srx"],
      source: "data/srx_database/dossiers/TAMASHII_DEATHSHADE_DOSSIER.md",
    },
    {
      id: "db-dossiers-drakath-amaranth",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Drakath Amaranth",
      subtitle: "SRX field operative and First Lord of DeathShade Citadel",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Drakath Amaranth served SRX in special-combat operations before taking public office as First Lord of DeathShade Citadel.",
      body: [
        "Displaced from Xunaithia, Amaranth built a new life in the Realm and entered Shinra service during the 3100s. SRX records place him in difficult field assignments requiring unusual resilience and supernatural-threat experience.",
        "He later joined the leadership of DeathShade Citadel. His public record emphasizes service, adaptation, and regional governance; personal trauma and classified combat details remain sealed.",
      ],
      facts: [
        ["Origin", "Xunaithia"],
        ["SRX Service", "Special combat operations"],
        ["Later Office", "First Lord, DeathShade Citadel"],
        ["Public Status", "Historic ally and regional leader"],
      ],
      highlights: [
        "Entered SRX after dimensional displacement.",
        "Served in high-risk supernatural operations.",
        "Later assumed a public governance role outside Midgar.",
      ],
      related: ["db-dossiers-tamashii-deathshade", "srx", "the-realm"],
      source: "data/srx_database/dossiers/DRAKATH_AMARANTH_DOSSIER.md",
    },
    {
      id: "yakumo-kaoryu",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Yakumo Kaoryu",
      subtitle: "Independent ruler, dimensional scholar, and strategic ally",
      classification: "Diplomatic Public Record",
      image: null,
      imageStatus: "No authorized diplomatic portrait on file.",
      summary:
        "Yakumo Kaoryu is an independent ruler and long-standing strategic ally whose research partnerships influenced dimensional science and the development of ORACLE.",
      body: [
        "Public records trace Kaoryu's association with Shinra leadership to approximately 3084 CE. His work in dimensional research and weapons design made him an important external partner during the company's expansion.",
        "Kaoryu later founded and ruled Gensousekai while maintaining an independent relationship with SRX. His collaboration on early ORACLE concepts is acknowledged publicly; sovereign capabilities and defense resources are not described here.",
      ],
      facts: [
        ["Public Role", "Founder and ruler of Gensousekai"],
        ["Shinra Association", "Strategic ally since approximately 3084 CE"],
        ["Known Fields", "Dimensional research; weapons design"],
        ["Historic Collaboration", "Early ORACLE development"],
      ],
      highlights: [
        "Maintained a long-term alliance without entering Shinra command.",
        "Contributed to foundational dimensional and systems research.",
        "Sovereign military capabilities are omitted from the public record.",
      ],
      related: ["srx", "sephiroth-raiku", "the-realm"],
      source: "data/srx_database/dossiers/YAKUMO_KAORYU_DOSSIER.md",
    },
    {
      id: "db-dossiers-nico-takahashi",
      directories: ["bios", "dossiers"],
      category: "dossiers",
      title: "Nico Takahashi",
      subtitle: "Executive protector and Silveredge guardian",
      classification: "Historical Service Record",
      image: null,
      imageStatus: "No verified public portrait on file.",
      summary:
        "Nico Takahashi, also associated with the Silveredge name, served as a trusted protector within Shinra's executive and family security network.",
      body: [
        "Takahashi's public history reflects a difficult path from early conflict to institutional trust. Over time, he became a reliable guardian whose service connected the surviving Silveredge line with Shinra leadership.",
        "The public release recognizes his protective role without disclosing private identities, wards, or active security arrangements.",
      ],
      facts: [
        ["Known Names", "Nico Takahashi; Graves Silveredge"],
        ["Known Service", "Executive protection and guardianship"],
        ["Institutional Link", "Silveredge and Shinra leadership"],
        ["Release Scope", "Historic service only"],
      ],
      highlights: [
        "Became a trusted protector after an earlier period of conflict.",
        "Served as a link between Silveredge survivors and Shinra leadership.",
        "Current protective assignments remain private.",
      ],
      related: ["xeria-silveredge", "alexander-raiku", "srx"],
      source: "data/srx_database/dossiers/NICO_TAKAHASHI_DOSSIER.md",
    },
  ].forEach(release);
})();
