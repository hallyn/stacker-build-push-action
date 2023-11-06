import * as core from "@actions/core";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";

import { StackerCLI } from "./stacker";
import * as installer from "./installer";
import * as utils from "./utils";

export const stackerBin = "stacker";
export const stackerOrg = "project-stacker";
export const stackerRepo = "stacker";

export async function run(): Promise<void> {
    if (process.env.RUNNER_OS !== "Linux") {
        throw new Error("stacker, and therefore this action, only works on Linux. Please use a Linux runner.");
    }

    let releaseData = await installer.resolveReleaseData();
    let version = releaseData.tag_name

    core.info(`Installing stacker version: ${version}`);

    // get stacker cli
    const stackerPath = await io.which("stacker", true);
    const cli: StackerCLI = new StackerCLI(stackerPath);

    // print stacker version
    await cli.execute(["--version"], { group: true });

    // get stacker file path from input
    const stackerfile = core.getInput("file");

    // get build-args from input
    const substitutes = utils.getInputList("build-args");

    // get layer-type from input
    const layerTypes = utils.getSpaceSeparatedInput("layer-type");

    await cli.build(stackerfile, layerTypes, substitutes);

    // get tags from input
    const tags = utils.getSpaceSeparatedInput("tags");

    const registryURL = core.getInput("url");
    const username = core.getInput("username");
    const password = core.getInput("password");
    const skipTLS = core.getInput("skip-tls") === "true";

    if (registryURL) {
        await cli.publish(stackerfile, layerTypes, substitutes,
            registryURL, tags, username, password, skipTLS);
    }
}

run().catch(core.setFailed);
