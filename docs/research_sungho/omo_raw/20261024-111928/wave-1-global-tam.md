st_01a16bb4 [completed] transcript via event-log:
tool: todo
tool: eval
tool: eval
tool: eval
tool: eval
assistant: # SprayWindow global market sizing (as of 2026-10-24)

**Method and gaps.** I ran about 15 searches and 9 page fetches, with no subagents and no files written. These were not found:
- US per-crop spray-pass counts. The USDA ERS/NASS pages exist, but I did not extract numbers.
- The Statistics Canada pass-count table. Only the header loaded.
- Canada and Australia soy and corn area, EU soy and cotton area, and Brazil and Argentina wheat area.
- The Dataintelo full page, which returned 403. Its figure comes from the search snippet only.

**Label key:** M = measured (cited), A = assumed, D = derived (formula shown).

## 1. Ag weather services and adjacent software markets (M, analyst estimates)

| Segment | Size | CAGR | Source (date) |
|---|---|---|---|
| Agricultural weather forecasting services | $1.97B (2025) → $4.58B (2034) | 9.8% | [Dataintelo](https://dataintelo.com/report/agricultural-weather-forecasting-services-market) (snippet only) |
| Weather forecasting for agriculture | $1.20B (2025) → $2.20B (2032) | 8.3% | [Future Data Stats](https://www.futuredatastats.com/weather-forecasting-agriculture-market) |
| Farm management software | $4.8B (2025), $5.5B (2026e) → $19.7B (2033); North America 38.1% share | 20.1% (2026–33) | [Grand View Research](https://www.grandviewresearch.com/industry-analysis/farm-management-software-market) |
| Crop spraying services | $6.84B (2025) → $9.8B (2035) | 3.7% | [WiseGuyReports](https://www.wiseguyreports.com/reports/crop-spraying-service-market) (snippet only) |

- **Disagreement:** the two weather estimates differ by about 1.6x on the 2025 base ($1.20B vs $1.97B). The forecast horizons also differ, so the CAGRs are not directly comparable.
- **Mordor / Precision-Ag software:** [Mordor](https://www.mordorintelligence.com/industry-reports/agriculture-software-market) appeared in search, but I captured no figure.

## 2. Crop protection and application services (M)

| Metric | Value | Source (date) |
|---|---|---|
| Global crop protection, factory-gate | $70.06B in 2024, down 6.4% (first fall since 2016) | [AgbioInvestor via Agropages](https://cn.agropages.com/news/NewsDetail---34362.htm); [AgriBusiness Global, 2025-05-19](https://www.agribusinessglobal.com/agrochemicals/china-price-index-chinese-crop-protection-companies-need-to-restart-the-road-to-re-globalization/) |
| Global crop protection chemicals | $79.3B (2024) → $101B (2029), 5.0% CAGR | [MarketsandMarkets, 2024-06-25](https://www.prnewswire.com/news-releases/crop-protection-chemicals-market-worth-101-0-billion-by-2029--exclusive-report-by-marketsandmarkets-302181635.html) |
| Global crop protection products | $83.86B (2024) → $121.47B (2032), 4.74% CAGR | [Data Bridge](https://www.databridgemarketresearch.com/reports/global-crop-protection-products-market) |
| US farm customwork and custom hauling spend | $10.05B in 2022 (up from $7.56B in 2017) | [Axia Growth, updated 2026-10-03](https://axiagrowth.com/resources/industries/agriculture/farm-production-services), citing Census of Agriculture |
| US receipts, NAICS 115112 (soil prep, planting, cultivating, custom spraying) | $4.60B in 2022, 2,142 firms (2,016 with fewer than 20 employees) | Axia (same page) |
| US aerial applicators | 1,560 businesses (NAAA) | Axia (same page) |
| US spray-drone acres | 16.4M acres in 2025, up 58.7% year over year; price per acre fell from $21 to $13 | Axia (same page) |
| Custom-applied share of dealer sales, 2025 | 78% of fertilizer, 51% of crop protection | Axia, citing CropLife/Purdue |
| Top-100 retailers' custom application revenue | about $1.6B in 2017 | [CropLife](https://www.croplife.com/croplife-top-100/croplife-100-custom-application-good-growth-potential-risk/) |

Crop protection spans three sources and about $70B to $84B, so the "$75–80B" in the brief is reasonable.

## 3. Area of sprayed crops, FAS area harvested 2025/26, Mha (M)

| Country | Wheat | Soy | Corn | Cotton | Sum (Mha) |
|---|---|---|---|---|---|
| US | 15.1 | 32.5 | 36.8 | 3.2 | 87.6 |
| Brazil | n/f | 48.5 | 22.8 | 2.1 | 73.4 |
| Argentina | n/f | 16.2 | 8.2 | n/f | 24.4 |
| EU | 24.0 | n/f | 8.2 | n/f | 32.2 |
| Canada | 10.6 | 2.3 | n/f | n/f | 12.9 |
| Australia | 12.4 | n/f | n/f | 0.47 | 12.9 |
| India | 32.8 | 12.4 | 14.4 | 11.5 | 71.1 |
| China | 23.6 | 10.3 | 45.0 | 3.1 | 82.0 |
| **Total** | 118.5 | 122.2 | 135.4 | 20.4 | **396.5** |

Sources: [wheat](https://www.fas.usda.gov/data/production/0410000), [soy](https://www.fas.usda.gov/data/production/2222000), [corn](https://www.fas.usda.gov/data/production/0440000), [cotton](https://www.fas.usda.gov/data/production/2631000). "n/f" means not found or not major in the pages I retrieved, so it is counted as 0 and the total is a floor.

- **US planted, 2026 (M):** the USDA NASS [Acreage report, 2026-06-30](https://www.nass.usda.gov/Newsroom/2026/06-30-2026.php) gives corn 95.3M, soy 85.4M, wheat 42.7M and cotton 9.85M acres. That totals 233.25M acres (D), about 94.4 Mha. It is higher than the FAS harvested figure (87.6 Mha) because planted area and harvested area are different bases.
- **Other cross-checks (M):** the [Copa-Cogeca EU-27 cereals file](https://copa-cogeca.eu/Flexpage/DownloadFile/?id=13651631) gives EU common wheat at 21.2M ha for harvest 2025. FAS India cotton planted is 11.4M ha ([FAS GAIN](https://apps.fas.usda.gov/newgainapi/api/Report/DownloadReportByFileName?fileName=Cotton+and+Products+Annual_New+Delhi_India_IN2025-0020.pdf)).

## 4. Spray applications per season (thin evidence)

| Finding | Type | Source |
|---|---|---|
| Brazil soybean rust fungicide: 2 to 5 applications per season | M | [InTech chapter](https://doi.org/10.5772/67454) |
| Brazil second-crop soy trials: 4 to 6 fungicide treatments | M (trial design, not farmer average) | [UTFPR](http://repositorio.utfpr.edu.br/jspui/handle/1/36318) |
| Western Bahia: more than 10 insecticide sprays per season by 2012/13 (from 2 to 4 in the 1980s) | M | [IRAC / Omoto](https://irac-online.org/documents/challenges-to-control-lepidopteran-pests-in-a-multi-crop-environment-in-brazil-c-omoto/?ext=pdf) |
| US and Canada averages | Not extracted | [ERS ARMS](https://www.ers.usda.gov/data-products/arms-farm-financial-and-crop-production-practices/tailored-reports-crop-production-practices/), [StatCan 32-10-0209-02](https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3210020902), [NASS Chemical Use](https://www.nass.usda.gov/Surveys/Guide_to_NASS_Surveys/Chemical_Use/) |

## 5. Bottom-up TAM / SAM / SOM

**Assumptions (A):**
- **A1:** price is per acre per season, $0.10 / $0.30 / $0.50 (low / mid / high). Mid is my pick.
- **A2:** an average of 3 spray passes per acre across the four crops, used only for the per-pass sensitivity.
- **A3:** 40% of US acres are sprayed by custom applicators, including ag-retailer applicators. This is bracketed by the 51% custom-applied share of crop protection sales (Axia).
- **A4:** SOM share is 5% to 10% of SAM acres within 3 years.
- **A5:** 1 ha = 2.471 acres.

| Tier | Formula | Acres | Low ($0.10) | Mid ($0.30) | High ($0.50) |
|---|---|---|---|---|---|
| TAM (8 regions, 4 crops) | 396.5 Mha × 2.471 | 980M (D) | $98M | $294M | $490M |
| TAM, per-pass pricing (A2) | acres × 3 passes × price | 2.94B acre-passes | $294M | $882M | $1.47B |
| SAM (US custom-applied acres) | 233.25M × 40% | 93.3M (D) | $9.3M | $28M | $46.7M |
| SOM at 5% of SAM | 93.3M × 5% | 4.67M | $0.47M | $1.4M | $2.3M |
| SOM at 10% of SAM | 93.3M × 10% | 9.33M | $0.93M | $2.8M | $4.7M |

**Cross-checks (D):**
- **Applicator revenue:** US NAICS 115112 receipts are $4.60B. At 1% to 2% spent on software, that gives $46M to $92M. This is above my mid SAM of $28M and consistent with the high case, so $9M to $47M is a reasonable range.
- **Share of crop protection spend:** TAM mid is $294M against $70B (AgbioInvestor) of crop protection spend, about 0.4%. It is plausible.
- **Share of ag weather:** the mid TAM is 15% to 25% of the $1.2B to $1.97B ag-weather market. That ratio is high, so I would treat the mid TAM as an upper-middle case.

**Takeaway:** at $0.10–$0.50 per acre per season, the beachhead is a tens-of-millions-of-dollars SAM and the 3-year SOM is single-digit millions. The venture-scale story depends on per-pass pricing, a compliance-records add-on, or expansion into Brazil and Argentina, not on US custom applicators alone.

## EXPAND
- Extract US pass counts by crop from USDA NASS Chemical Use and ERS ARMS (Pesticide Use report).
- Get the StatCan 32-10-0209-02 values for Canada.
- Add Brazil and Argentina wheat, Canada and Australia canola, and EU soy.
- Add specialty crops (fruit, vegetables, tree nuts), which have higher spray frequency and value per acre.
- Quantify the compliance angle: EPA Worker Protection Standard, state application-record rules, and dicamba/drift-regulation record requirements.
- Benchmark competitor pricing: Climate FieldView, Granular, FarmLogs, DTN, Farmers Edge, Arable, Sprayable, Rantizo (drone), and Bayer apps.
- Look for per-acre software pricing from custom-applicator software vendors.
- Test whether the compliance-record pricing is per-record or per-acre.
- Clarify whether "first customer" means ag-retailer applicators or independent custom applicators, since their acreage and revenue differ.

## CLAIMS
- CLAIM: Global crop protection is about $70B to $84B (2024). — RISK: Medium. Definitions differ (factory-gate vs distribution value). — SOURCES: AgbioInvestor via Agropages, M&M, Data Bridge. — COUNTER: M&M's $79.3B and Data Bridge's $83.86B are not like-for-like with AgbioInvestor's $70.06B. — PRIMARY: AgbioInvestor report.
- CLAIM: The ag weather forecasting market is $1.2B to $2.0B (2025). — RISK: High. Small-report vendors disagree 1.6x and the Dataintelo figure is from a snippet. — SOURCES: Dataintelo, Future Data Stats. — COUNTER: Weather-data revenue is likely embedded in farm software (DTN, Farmers Edge) and not counted separately. — PRIMARY: Report PDFs (paywalled).
- CLAIM: Farm management software is $4.8B (2025), growing 20% a year. — RISK: Medium to high. A 20% CAGR is aggressive and Grand View's definition includes precision-farming hardware and services. — SOURCES: Grand View Research. — COUNTER: The software segment is only 64.6% of the total. — PRIMARY: Grand View report.
- CLAIM: Tracked area for the four crops across the eight regions is at least 396.5 Mha. — RISK: Low to medium. Several country-crop cells are missing and the figures are FAS area harvested, not planted. — SOURCES: FAS PSD pages. — COUNTER: NASS planted area for the US alone is 94.4 Mha against 87.6 Mha harvested. — PRIMARY: FAS PSD online.
- CLAIM: The US 2026 area for the four crops is 233.25M planted acres. — RISK: Low. — SOURCES: NASS Acreage, 2026-06-30. — COUNTER: Survey variability, and the report uses planted rather than sprayed acres. — PRIMARY: NASS acrg0626.pdf.
- CLAIM: 40% of US acres are sprayed by custom applicators (A3). — RISK: High. It is unsourced for acres. — SOURCES: None directly; only the 51% custom-applied share of crop protection sales (Axia citing CropLife/Purdue). — COUNTER: Dealer-sales share is not the same as acre share, and large farms self-apply. — PRIMARY: USDA ARMS custom application questions.
- CLAIM: Price tolerance is $0.10 to $0.50 per acre. — RISK: High. It is the user's assumption, not tested. — SOURCES: None. Spray-drone price per acre fell from $21 to $13 (Axia), which suggests price pressure on services. — COUNTER: Software priced per acre-season may be above what applicators accept. — PRIMARY: Customer pricing interviews.
- CLAIM: The SAM is $9M to $47M and the 3-year SOM is $0.5M to $5M. — RISK: High. Stacked assumptions A1, A3 and A4, and the 1% to 2% of revenue cross-check implies a higher SAM of $46M to $92M. — SOURCES: Derived. — COUNTER: Per-pass pricing would triple the SAM, which is why Section 5 shows both. — PRIMARY: Pilot customer contracts.
- CLAIM: Brazil soy sees 2 to 5 fungicide passes, with 10 or more insecticide sprays in parts of Western Bahia. — RISK: Medium. Regional and trial-based. — SOURCES: InTech, IRAC/Omoto. — COUNTER: Farmer-average passes may be lower outside high-pressure regions. — PRIMARY: Embrapa and Conab or IBGE pesticide-use surveys.
tool: todo
tool: todo
assistant: Ask: Research the global market size for SprayWindow and propose a bottom-up TAM/SAM/SOM labeled MEASURED, ASSUMED or DERIVED. Wanted: a cited report with tables, EXPAND leads and CLAIMS lines.

For you: all 5 tasks are done, and the full report is in my previous message. I wrote no files and spawned no subagents.

- **Bottom-up result:** I covered about 396 Mha (980M acres) across eight regions and four crops. TAM is $98M, $294M or $490M at $0.10, $0.30 or $0.50 per acre per season. The US custom-applicator SAM is $9M to $47M, and the 3-year SOM is about $0.5M to $5M.
- **Pricing basis:** per-pass pricing at an assumed 3 passes per acre would triple the TAM and SAM figures.
- **Top-down context:** crop protection is $70B to $84B, ag weather $1.2B to $2.0B, farm software $4.8B, and US NAICS 115112 receipts $4.6B.

**Not found or weak:**
- US and Canada spray-pass counts (the USDA ERS/NASS pages and the StatCan table exist, but I did not extract their numbers).
- Some country-crop area cells, which makes the area total a floor.
- The Dataintelo and WiseGuyReports figures come from snippets only.
- The 40% custom-application share and the price range are assumptions.

Now: no task remains. Next: no task remains.