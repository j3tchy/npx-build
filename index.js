#!/usr/bin/env node
const spinner = require('cli-spinners');
const { exit } = require('process');

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const logUpdate = require('log-update');


let appName = process.argv[2];
let appDirectory = `${process.cwd()}/${appName}`;

const makeDir = async () => {
    const { stderr } = await exec(`mkdir ${appName}`);
    if (stderr) {
        console.log(stderr);
        exit(1);
    }
}

const packStarterKit = () => {
    return new Promise(resolve => {
        exec(`npm pack @halo/starter-kit`, (error) => {
            if (error) {
                console.log(error);
                exit(1);
            }
            console.log('Packing Starter Kit');
            resolve();
        })
    })
};


const getVersion = async () => {
    const { stdout: versionNumber } = await exec(`npm show @halo/starter-kit version`);
    console.log(`Retrieving latest ICDS starter kit version`);
    return versionNumber.trim();
}

const unzipStarterKit = async (versionNumber) => {
    const { stderr } = await exec(`tar -xzf ${process.cwd()}/halo-starter-kit-${versionNumber}.tgz -C ${appDirectory}`);
    console.log('Unzipping starter-kit');
    if (stderr) {
        console.log(stderr);
    }
}

const copyStarterKitToProjectRoot = async () => {
    const { stderr } = await exec(`mv ${appDirectory}/package/* ${appDirectory}`);
    console.log(`Copying files to ${appDirectory}`);

    if (stderr) {
        console.log(stderr);
        exit(1);
    }
}

const cleanUpDir = async (versionNumber) => {
    const { stderr } = await exec(`rm -rf ${appDirectory}/package ${process.cwd()}/halo-starter-kit-${versionNumber}.tgz`);
    if (stderr) {
        console.log(stderr);
        exit(1);
    }
}

const installPackages = async () => {
    let i = 0;
    
    console.log('Installing starter-kit packages');

    setInterval(() => {
        const { frames } = spinner.dots;
        logUpdate(frames[i = ++i % frames.length])
    }, spinner.dots.interval);

    const { stderr } = await exec(`cd ${appDirectory} && npm install`);

    if (stderr) {
        console.log(stderr);
        exit(1);
    }
}

async function run() {
    const latestVersion = await getVersion();

    makeDir();
    packStarterKit().then(() => {
        unzipStarterKit(latestVersion).then(() => {
            copyStarterKitToProjectRoot().then(() => {
                cleanUpDir(latestVersion).then(() => {
                    installPackages();
                });
            });
        });
    })
}

run();