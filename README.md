# JUPAS Compass

A Chinese-language JUPAS programme directory for the 2026/27 application cycle (2027/28 entry), with a DSE score calculator for programmes whose official formulas have been verified and implemented.

## Run locally

```sh
npm start
```

Open `http://127.0.0.1:4173`.

## Refresh official data

```sh
npm run sync:admissions
npm run sync:data
```

`sync:admissions` downloads HKU's official admissions API, CUHK's official calculator data, HKBU's official programme-calculator data, and PolyU's official score-calculator page. It also refreshes the curated HKUST and EdUHK tables, Lingnan's 2027-entry PDF tables, and HKMU's published calculator conversions and weights. `sync:data` then fetches the JUPAS programme directory and merges the admissions overrides. Review the generated JSON diff and confirm the linked source publication periods before publishing.

## Coverage and limitations

- HKU formulas are for 2027/28 entry; score quartiles are historical 2026 admissions data, transcribed from HKU's official 2027 JUPAS guide.
- HKUST formulas and score conversions are for 2027/28 entry; its 2026 admissions score publication provides the highest attainable score, median and lower quartile, but no upper quartile. Sixth-subject bonuses use the official formula maximum and grade conversion table.
- PolyU formulas and Category A/B/C conversion data are synced from its official 2027 calculator for all 47 listed programmes. Its 2026/27 published average and lower-quartile score are shown when the programme and source programme code match; the calculator page does not publish a median. Sixth-subject bonuses are calculated as 10% of the weighted sixth-subject score when it reaches Level 3 or above.
- HKBU formulas are for 2027/28 entry across all 23 JUPAS programmes. Grade conversions and accepted subject lists come from the university's official calculator API; programme weights and minimum requirements are sourced from its 2027-entry PDF. Historic admission-score statistics are not yet integrated.
- EdUHK formulas are for 2027/28 entry across all 26 JUPAS programmes. Best 5 excludes Citizenship and Social Development; Category A/B/C conversions, programme weights, subject requirements and specified ApL weightings are transcribed from the 2027-entry official PDFs. The calculator accepts two ApL results so users can calculate a Best 5 score; eligibility rules (including the limit on how many ApL subjects count toward general entrance requirements) must still be checked separately.
- Lingnan formulas are for 2027/28 entry across all 23 JUPAS programmes. The current official PDF has “26-27” in its filename, but its formula and weighting sections explicitly say “2027 Entry.” Category A weights and Category C conversions are implemented; Category B and alternative Chinese qualification conversions are linked but not calculated because the PDF does not provide score values for those inputs.
- HKMU formulas are for 2027/28 entry across the 28 programmes in the current JUPAS catalogue. The calculator implements the official Best 5 method, published Category A/C conversions, and listed programme weights. Category B is only counted for the two subjects explicitly mapped to JS9580; other dynamic programme-specific ApL lists are not guessed. HKMU historic admission-score statistics are omitted because the official 2026 list does not safely match current programme codes.
- Category B and C inputs are enabled only for programmes whose synced score model includes those categories. The calculator does not validate every entrance-eligibility condition; consult the programme-specific requirements and official sources before relying on a score.
- CUHK formula and expected-score data are from its official 2026-entry calculator; admission quartiles are from 2025 admissions. CUHK's calculator excludes Category C and other listed adjustments. The 2027-entry formula is not represented as current until CUHK publishes it.
- Special CUHK medical programmes are marked unsupported until their specific calculator logic is reproduced. Other programmes without a fully supported official formula will not produce an estimate.
- CityU's 2027 programme scoring formula could not be verified from accessible official material, so its formulas remain disabled and are labelled unverified.
- Historical score statistics are references, not admission thresholds or predictions. The calculator reports a formula score only; it does not estimate admission probability or replace the universities' official calculators.

The programme detail view links the available official formula, conversion, requirements and score sources. Do not add a score model or quartile statistic without a source for the specific programme and admissions year.

## GitHub Pages

The `Deploy GitHub Pages` workflow tests the catalogue and publishes only the static site files when changes reach `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** in the repository; after the workflow completes, the project site will be available at `https://ichanliu.github.io/hk-guessing-geo/`. Assets and catalogue requests use relative URLs so the site also works under this project path.

## Tests

```sh
npm test
```
