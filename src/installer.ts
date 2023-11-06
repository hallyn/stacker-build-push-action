import * as core from "@actions/core";
import * as github from '@actions/github';
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import path from "path";
import { stackerBin, stackerRepo, stackerOrg } from "src";


export async function resolveReleaseData() {
    let version = core.getInput('version');
    let token = core.getInput('token');

    const octokit = github.getOctokit(token);

    let releaseData: any = {}

    if ((!version) || (version.toLowerCase() === 'latest')) {
        core.info("Get release info for latest version")
        releaseData = await octokit.rest.repos.getLatestRelease({
            "owner": stackerOrg,
            "repo": stackerRepo,
        });
    } else {
        core.info(`Get release info for release ${version}`)
        releaseData = await octokit.rest.repos.getReleaseByTag({
            "owner": stackerOrg,
            "repo": stackerRepo,
            "tag": version,
        });
    }

    return releaseData.data
}

export async function makeAvailableInPath(download, version) {
    core.info(`Cache file ${download} and rename to generic name`);
    const cachedPath = await tc.cacheFile(download, stackerBin, stackerBin, version);
    const filePath = path.join(cachedPath, stackerBin)

    core.info(`Making ${stackerBin} binary executable`);
    await exec.exec("chmod", ["+x", filePath]);

    core.info(`Make ${cachedPath} available in path`);
    core.addPath(cachedPath);
}
