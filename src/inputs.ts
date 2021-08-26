import {InputOptions} from '@actions/core';
import * as Inputs from './namespaces/Inputs';

type GetInput = (name: string, options?: InputOptions | undefined) => string;

export const parseInputs = (getInput: GetInput): Inputs.Args => {
    const repo = getInput('repo');
    const token = getInput('github-token', {required: true});
    const ciFuzzToken = getInput('ci-fuzz-api-token', {required: true});

    const name = getInput('name');


    if (repo && repo.split('/').length != 2) {
        throw new Error('repo needs to be in the {owner}/{repository} format');
    }

    return {
        repo,
        name,
        token,
        ciFuzzToken,
    };
}

