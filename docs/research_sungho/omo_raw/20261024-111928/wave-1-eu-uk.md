st_01a16bb6 [completed] transcript via event-log:
tool: todo
tool: eval
assistant: Parallel searching tripped the rate limits, and only the German query returned anything. I'll switch to fetching primary-source URLs directly, which doesn't depend on a search provider.
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
tool: eval
assistant: # EU/UK spray-weather compliance: rules and market

I ran 12+ searches and about 20 fetches. Search providers were rate-limited, so some items are unconfirmed and marked as such.

## Main finding
**Regulation (EU) 2023/564 does not make weather a legal record field.** The mandatory fields are product, authorisation number, date, dose, area, crop, EPPO code and BBCH stage. The reason is that the EU record rule is about product and crop, not conditions. Weather is legally relevant only through national "do not spray above X wind" rules and label conditions. The compliance product is therefore "prove the conditions were legal at the time", not "satisfy the EU weather record".

## 1. EU level

| Item | What I found | URL |
|---|---|---|
| Reg. (EU) 2023/564 | Commission Implementing Regulation of 10 March 2023, OJ L 74, 13.3.2023. It sets the content and format of professional-user records under Art. 67 of Reg. 1107/2009. Records should be kept electronically (recital 9). | https://eur-lex.europa.eu/eli/reg_impl/2023/564/oj/eng |
| Start date | New content and timing rules apply from **1 Jan 2026**: record each use "promptly", plus the authorisation number, EPPO codes and BBCH stage where the label restricts by growth stage. | https://www.daera-ni.gov.uk/articles/new-requirements-plant-protection-product-ppp-record-keeping-professional-users |
| Electronic-transfer deferral | Implementing Reg. (EU) 2025/2203 (31 Oct 2025) lets Member States defer the machine-readable transfer to **1 Jan 2027**. Northern Ireland (DAERA) did this, with paper records converted by 31 Jan of the following year. DAERA also won't penalise the new content fields during 2026. | https://eur-lex.europa.eu/LexUriServ/LexUriServ.do?uri=CELEX%3A32025R2203%3ADE%3AHTML |
| Retention and access | Records kept at least 3 years and handed to the authority on request. In NI, within 10 working days. Contractors must give the client a copy "without undue delay". Accepted formats are CSV, XLSX, XML and JSON; PDF and scans are not machine-readable. | DAERA page above |
| Member-state state of play | A Council document (ST 8203/26) says the extra details are required since 1 Jan 2026. I did not read the rest. | https://data.consilium.europa.eu/doc/document/ST-8203-2026-INIT/en/pdf |
| SUD 2009/128/EC | Art. 9 prohibits aerial spraying, with narrow derogations. Recital 15 requires measures against spray drift into water (buffer zones, hedges). The Directive sets no wind figure, so wind limits come from national law and labels. I only saw excerpts, not the full articles. | https://eur-lex.europa.eu/eli/dir/2009/128/oj/eng |

I also did not verify whether Germany or France have already enforced the 1 Jan 2027 electronic deadline.

## 2. National rules

| Country | Weather and drift rule | Other drift and buffer rules | Source |
|---|---|---|---|
| **France** | Hard legal limits: no treatment if wind is above Beaufort 3 (**19 km/h**) or rain is **above 8 mm/h**. This is the arrêté of 4 May 2017, amended 27 Dec 2019, Art. 2. | Untreated zone (ZNT) of at least 5 m by watercourses. Wider zones apply near residents (that detail comes from the Bayer sheet and the search snippet; I did not read the table). | https://draaf.occitanie.agriculture.gouv.fr/zones-de-non-traitement-conditions-meteorologiques-et-autres-conditions-d-a4465.html |
| **Germany** | Wind above **5 m/s (about 18 km/h)** is "not permissible" under good professional practice (GfP). Above 3 m/s, drift-reducing measures are advised. This comes from a Chamber of Agriculture leaflet, so it is guidance rather than a statute. | § 4a PflSchAnwV: 10 m from water (5 m with closed year-round vegetation). Product conditions (NW codes) give distances that shrink with 50/75/90 % drift-reducing nozzles, e.g. 20 m falling to 5 m. | https://www.lwk-saarland.de/fileadmin/landwirtschaftskammer/data/Gute_fachliche_Praxis_Abdrift.pdf; https://www.gesetze-im-internet.de/pflschanwv_1992/__4a.html; https://www.isip.de/resource/blob/505838/22863d5753e937f47a1465d7b513fae5/abstandsauflagen-und-weitere-rechtliche-regelungen-im-pflanzenschutz-data.pdf |
| **Netherlands** | Syngenta NL states spraying above **5 m/s** is prohibited. I did not confirm the statute. | Activiteitenbesluit: at least 75 % drift-reducing technique on the whole field, edge nozzles by water, and a crop-free zone (50–150 cm depending on class and crop). | https://www.syngenta.nl/duurzame-landbouw/driftreductie; https://www.cumela.nl/sites/default/files/2022-01/DRT-lijst%20%5B20211206%5D.pdf |
| **UK (GB)** | The Sustainable Use Regulations 2012 require "all reasonable precautions" against drift, including taking account of the weather. No numeric wind limit in law. The Code of Practice recommends a steady Force 2 breeze blowing away from sensitive areas. It is not itself an offence to ignore it, but failing to follow it can be used as evidence of a breach. | Label buffer zones. LERAP can reduce them for water (via the HSE page) with 3/4-star low-drift nozzles (via FAS). | https://www.hse.gov.uk/pesticides/using-pesticides/spray-drift/; https://www.fas.scot/environment/water-management/pesticide-management/pesticide-information-note-spray-drift/ |

I did not read the UK Code's wind-speed table itself. Reg. 2023/564 is an EU instrument; I saw it applied in Northern Ireland, but I did not check whether GB mirrors the new fields.

## 3. Customer base

| Segment | Number | Quality | URL |
|---|---|---|---|
| UK spray operators (NRoSO, run by BASIS since Jan 2023) | About 19,500 inherited in 2023; "in excess of 20,000" claimed. Roughly 21,000 in a 2023 press piece. | Good for the UK professional core. Not an NSTS count (NSTS is the sprayer-testing scheme, which I did not find a count for). | https://nroso.org.uk/; https://basis-reg.co.uk/news/article/basis-nroso-members |
| EU agricultural, rural and forestry contractors | About **150,000** firms, about 600,000 people, and about 50 % of farm work done by contractors. | An estimate: CEETTAR says there are no official statistics. Covers all contractor work, not only spraying. | https://www.ceettar.eu/sectors/agriculture |
| EU certified professional PPP users in total | **Not found.** | A gap. Eurostat's `aei_pestuse` covers tonnage, not users. | https://ec.europa.eu/eurostat/databrowser/view/aei_pestuse/default/table?lang=en |

## 4. Existing tools and prices

| Tool | What it does | Price I found | Confidence / URL |
|---|---|---|---|
| **Sencrop** (FR) | Spraying Windows module, Weather Pro plan: green/orange/red by product type. Generic wind green below 8 km/h, orange 8–18 km/h. Uses its own stations: 35,000+ installed in Europe, 40,000+ users. | UK plans £79 / £149 / £229 per year. Older EUR figures: €131 and €227 per year. Station about €620 plus €470 for the wind sensor. | UK partner template, Profi review, Play Store. https://faq.sencrop.com/en/articles/8926492-how-do-i-read-and-understand-my-spraying-windows; https://lp.sencrop.com/uk-template2-subscription/; https://www.profi.co.uk/test-centre/sencrop-weather-station-weather-info-from-the-field-straight-to-your-pocket/ |
| **xarvio FIELD MANAGER** (BASF, DE) | Free basic plan for field records. Paid Applikations-Timer gives hourly spray-weather forecast and spacing-condition ("Abstandsauflagen") support. | About €10/ha/year; farm licence about €1,500/year flat for over 150 ha; timer from €400. | Secondary sources, dated. The official price page returned no text. https://ag.xarvio.com/germany/field-manager/preise; https://www.ki-syndikat.de/tools/xarvio/ |
| **ISIP "Spritzfenster"** (DE) | Regional public-sector advisory site; it ran news items but I did not open the spray-window tool. | Appears free. | Unverified. https://www.isip.de |
| **meteoblue** | Spraying Window and Meteogram Agro, sold through point+. | Consumer page: 10 CHF for 31 days, 30 CHF for 3 months. A 365-day price was not visible to me; business/API pricing not found. | https://www.meteoblue.com/en/pointplus; https://content.meteoblue.com/en/private-customers/website-help/agriculture/meteogram-agro/ |
| **Probcast** (UK) | Probabilistic farm weather for UK users. | Not found. | https://probcast.co.uk/ |
| **Kestrel 3550AG** | Handheld meter giving wind, humidity and Delta T at boom height. | Not found. | https://www.fwi.co.uk/machinery/technology/new-handheld-weather-monitor-to-improve-spraying-decisions |

I could not find anything on Agrovista, BASF's own spray-weather product, or Delta-T apps. Don't treat their absence as evidence they don't exist.

## What this means
- **Gap (my inference):** no tool found proves, for the record, that conditions were legal at the time of spraying. That matters most in France (19 km/h / 8 mm/h) and for contractors who must hand records to clients.
- **Price anchor:** about £79–229 per year (Sencrop) to about €10/ha (xarvio) sets the range for a paid product.
- **Timing:** the 1 Jan 2027 machine-readable deadline is a sales hook, but it only bites where Member States did not defer.

## EXPAND
1. Read the full UK Code of Practice wind table and the exact PPP Sustainable Use Regulations 2012 wording.
2. Get Germany's PflSchG § 12 and any Land-level wind rule, plus the Dutch statute behind the 5 m/s claim.
3. Find the real number of certified professional users per country (Sachkunde, Certiphyto, NL, UK PA1/PA2 certificate holders).
4. Check which Member States actually adopted the 1 Jan 2027 deferral and whether any require wind logging.
5. Get current official prices for xarvio, meteoblue business/API, Agrovista and Bayer/BASF tools.

## CLAIMS
- **Verified in a fetched primary or official source:** NI record fields, the 1 Jan 2026 start, the 1 Jan 2027 deferral, the 3-year retention and the 10-working-day response (DAERA); France's 19 km/h and 8 mm/h limits (DRAAF Occitanie); Germany § 4a 10 m / 5 m; HSE "reasonable precautions" wording and Force 2 guidance; CEETTAR's 150,000 contractors; the Sencrop wind thresholds.
- **Seen only in search snippets, not opened:** SUD Art. 9 and recital 15; the Council document's wording; NRoSO membership counts; the Sencrop, xarvio and meteoblue prices.
- **Single secondary source:** the Netherlands 5 m/s ban (Syngenta NL); Germany's 5 m/s limit (a Chamber leaflet, so guidance); the xarvio prices.
- **Not found:** total professional users in the EU, NSTS counts, and any weather-record requirement in Reg. 2023/564.
tool: todo
tool: todo
assistant: Ask: Research EU and UK rules that make weather a compliance requirement for pesticide spraying, plus the customer market (EN, compact tables, URLs, ending with EXPAND and CLAIMS) - wanted: a URL-backed research report.

For you: All 5 todo tasks are closed and the full report is in my previous message. These are the points that change what you'd build:
- **Reg. (EU) 2023/564 doesn't require weather records.** It requires product, authorisation number, date, dose, area, crop, EPPO code and BBCH stage. The new fields apply from 1 Jan 2026, and machine-readable transfer can be deferred to 1 Jan 2027 under Reg. 2025/2203. Source: https://www.daera-ni.gov.uk/articles/new-requirements-plant-protection-product-ppp-record-keeping-professional-users
- **Weather limits come from national law and labels.** France is a hard legal limit: no spraying above 19 km/h wind or 8 mm/h rain. Germany and the Netherlands use about 5 m/s, but my sources are a chamber leaflet and Syngenta NL, not statutes. GB law only requires "reasonable precautions" with a recommended Force 2 breeze.
- **Customers.** The UK has about 20,000 NRoSO sprayer operators, and the EU has an estimated 150,000 contractors (CEETTAR, an estimate that covers all contractor work, not only spraying). I found no EU total of certified professional pesticide users.
- **Prices.** Sencrop runs £79–229 per year plus stations. xarvio is about €10/ha per year from a secondary source, with a free basic plan. meteoblue point+ is 10 CHF a month on its consumer page. Official prices for xarvio, meteoblue business/API, Agrovista and BASF's own tool were not found.
- **Reliability.** Search providers were rate-limited. Several items rest on search snippets or one secondary source, and the CLAIMS section of the report grades each one.

Now: No task remains.
Next: No task remains.