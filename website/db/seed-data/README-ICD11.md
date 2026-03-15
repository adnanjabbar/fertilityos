# ICD-11 seed data

## Full WHO ICD-11 MMS (recommended)

1. Download the WHO Linearization Mini Output (English):  
   https://icd.who.int/dev11/Downloads/Download?fileName=LinearizationMiniOutput-MMS-en.zip

2. Unzip so that `LinearizationMiniOutput-MMS-en.txt` is at:  
   `website/db/seed-data/icd11-mms/LinearizationMiniOutput-MMS-en.txt`

3. From `website/`:  
   `node scripts/seed-icd11-full.js`

This loads the full ICD-11 for Mortality and Morbidity Statistics (~35,600+ codes) into `icd11_entities`.

## Optional: fertility subset

`icd11-subset.json` is a small set of codes with full descriptions. Use only for quick local testing:

`node scripts/seed-icd11.js`
