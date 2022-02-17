#Setup

1. Create a personal access token in Github that has access to the department-of-veterans-affairs org
2. Create a new file in root path ```.api.key```.  The contents of this file should be the personal access token from step 1.
3. Install dependencies via ```yarn install``` and build via ```yarn build```
4. To run and output results of report, use ```node dist/index.js [partial-iso-date-time]```
   1. [partial_iso_date_time] optionally can be used to limit the report to only include repos updated after a certain date time.
   2. Expects ISO 8601 date time format, but allows any leading partial value (e.g. 2021, 2021-01, 2021-01-01, 2021-01-01T14:00)
5. Each run will output two json files in the ```out``` directory:
   1. ```language-tally[partial-iso-date-time].json``` - A tally of # of bytes for languages across all repos, sorted by # of bytes descending.
   2. ```language-by-repo[partial-iso-date-time].json``` - A breakdown of the above *per* repo
   3. Runs will overwrite any existing files by the same name.