# JUPAS Compass

JUPAS Compass is an independent, Chinese-language guide to JUPAS programmes for the **2026/27 application cycle (2027/28 entry)**. It brings programme listings, published requirements, source links, available admissions statistics, and a DSE score estimator together in one place.

**Public website:** <https://ichanliu.github.io/jupascompass/>

This project is not affiliated with JUPAS or any university. Always confirm current requirements and calculations with the relevant official source.

## For students

- Search by programme name, institution, or JS code, and filter by institution or funding category.
- Select a programme to see the available requirements, score formula, grade conversions, statistics, and source links.
- Use the calculator only when a programme is marked **可計算**. It reports a formula score, not admission probability or a prediction.
- Check the year shown beside each formula and each statistic. They may refer to different admission cycles.

Historical scores are references, not admission cut-offs or guarantees. Missing values are not estimated. An unverified or unsupported formula is not used to produce a score.

## Data coverage and limitations

The programme directory is sourced from the [official JUPAS programme catalogue](https://www.jupas.edu.hk/en/programmes-offered/). The page shows when that catalogue was last synchronized. Formula, grade-conversion, requirement, and statistics sources are linked in each programme's details where available.

Official formula coverage is not the same for every institution or admission year. For example, CityU's formula is not calculated because a current official formula could not be verified; CUHK's currently represented calculator is for the 2026 entry cycle and is labelled as historical. The website identifies these limitations rather than filling gaps with estimates. See each programme's details and linked official sources before relying on any information.

The directory may be refreshed independently of admissions rules. A recent catalogue synchronization date does not mean every university has published new requirements or formula data for that date.

## Privacy and public content

DSE scores are calculated in your browser. The site does not send or save the grades you enter. It does request the public programme catalogue to display search results, and it loads typefaces from Google Fonts.

This public repository contains the website source, tests, and programme/admissions data used by the site. It does not contain user-entered grades, personal application records, conversation transcripts, or usage logs.

## Report a data issue

If you spot an incorrect programme, requirement, formula, or source link, [open an issue](https://github.com/ichanliu/jupascompass/issues) and include the JS code and the relevant official source. Do not include personal DSE results or application details.

## Development and data maintenance

Requires Node.js 20 or later.

```sh
npm start
npm test
```

The local site is served at `http://127.0.0.1:4173`.

To synchronize official data:

```sh
npm run sync:admissions
npm run sync:data
npm test
```

Review the generated JSON changes, source links, and source publication years before publishing. A successful sync does not by itself verify that a university has changed or republished an admissions rule.

GitHub Actions runs the tests and deploys the static site when changes reach `main`. The Pages deployment publishes only `index.html`, `styles.css`, `src/`, and `data/`; it does not publish the data-sync scripts or development server.
