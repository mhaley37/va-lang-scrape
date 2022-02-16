import { Octokit} from '@octokit/core';
import { paginateRest } from '@octokit/plugin-paginate-rest';
import fs = require('node:fs');
import { argv } from 'node:process';
import { fileURLToPath } from 'node:url';

type repoStub = {
    name: string, 
    lastUpdated?: string | null
}

type langBytes = {
    language: string, 
    bytes: number
};

const langsByRepo: (repoStub & {languages: langBytes[]})[] = [];
const langAggregate: langBytes[] = [];


let auth = fs.readFileSync('.apiKey').toString();
const org = 'department-of-veterans-affairs';
const MyOctokit = Octokit.plugin(paginateRest);
const octokit = new MyOctokit({auth});

// Only include repos updated since this ISO date time
const updatedSince = argv[2];
collectLangData(updatedSince)
.then( _=> {
    // TODO: Handle fs errors
    const sortedAgg = langAggregate.sort( (a, b) => b.bytes - a.bytes);
    !fs.existsSync('out') ? fs.mkdirSync('out') : '';
    const fileDateValue = updatedSince ? '-' + updatedSince : '';
    fs.writeFileSync(`out/language-tally${fileDateValue}.json`, JSON.stringify(sortedAgg));
    fs.writeFileSync(`out/language-by-repo${updatedSince ? '-' + updatedSince : ''}.json`,JSON.stringify(langsByRepo));
    console.log(sortedAgg);
    console.log(`There were ${langAggregate.length} repositories found ${ updatedSince ? 'updated since ' + updatedSince : ''}.`);
});
    

async function collectLangData(updatedAfter?: string) {
   const repos = await getReposForOrg(org,updatedAfter);
   if (repos) {
       await Promise.all(repos.map( repo => getLanguagesForRepos(repo)));
   }
}
async function getReposForOrg(org: string, updatedSince?: string) {
    try {
        const repos = await octokit.paginate('GET /orgs/{org}/repos', {org, per_page: 100});
        const filterFn = (r: typeof repos[number]) => !(updatedSince && (!r.updated_at || updatedSince > r.updated_at));
        return repos.filter( filterFn).map( r => {
            return {name: r.name, lastUpdated: r.updated_at};
        });
    }
    catch (err) {
        if (err instanceof Error) {
            console.log(`get reposForOrg err: ${err.message}`);
        }
    }
}

async function getLanguagesForRepos(repo: repoStub) {
    try {
        const rsp = await getRepoLanguages(org,repo.name);
        const repoLangs: langBytes[] = [];
        for ( const language in rsp.data) {
            repoLangs.push({language, bytes: rsp.data[language]});
        }       
        langsByRepo.push({name: repo.name, languages: repoLangs, lastUpdated: repo.lastUpdated}); 
        // Now add languages to aggregate
        repoLangs.forEach( res => {
            const index = langAggregate.findIndex( l => l.language === res.language)
            index > -1 ? langAggregate[index].bytes += res.bytes : langAggregate.push({language: res.language, bytes: res.bytes});
        });

    } catch (err) {
        if (err instanceof Error) {
            console.log(`getLangsPerRepo err: ${err.message}`);
        }
    }
}

function getRepoLanguages(owner: string, repo: string) {
    return octokit.request('GET /repos/{owner}/{repo}/languages',{owner, repo});
}