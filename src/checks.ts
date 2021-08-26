import {GitHub} from '@actions/github/lib/utils';
import * as core from '@actions/core';
import * as Inputs from './namespaces/Inputs';
import {Args} from './namespaces/Inputs';
import {Finding, Findings} from './namespaces/findings';
import {CheckAnnotation} from "./namespaces/CheckAnnotation";

type Ownership = {
    owner: string;
    repo: string;
};

function getFindingsString(finding: Finding): CheckAnnotation {
    return {
        path: finding.error_report.debugging_info.executable_path,
        annotation_level: "failure",
        title: finding.error_report.more_details.name,
        message: finding.error_report.more_details.description,
        raw_details: finding.error_report.input_data ? "Crashing input: " + finding.error_report.input_data : "No crashing input available",
        start_line: finding.error_report.debugging_info.break_points[0].location.line,
        end_line: finding.error_report.debugging_info.break_points[0].location.line
    };
}

function getFindingsStringArray(findings: Findings): CheckAnnotation[] {
    let findingsArray: CheckAnnotation[] = []
    findings.findings.forEach(finding => {
        findingsArray.push(getFindingsString(finding))
    })
    return findingsArray
}

const unpackInputs = (title: string, inputs: Args, findings: Findings): Record<string, unknown> => {
    let output;
    if (inputs.output) {
        output = {
            title,
            summary: findings.findings.length + " Findings found",
            text: inputs.output.text_description,
            actions: inputs.actions,
            annotations: getFindingsStringArray(findings),
            images: inputs.images,
        };
    }

    let details_url;

    if (inputs.conclusion === Inputs.Conclusion.ActionRequired || inputs.actions) {
        if (inputs.detailsURL) {
            const reasonList = [];
            if (inputs.conclusion === Inputs.Conclusion.ActionRequired) {
                reasonList.push(`'conclusion' is 'action_required'`);
            }
            if (inputs.actions) {
                reasonList.push(`'actions' was provided`);
            }
            const reasons = reasonList.join(' and ');
            core.info(
                `'details_url' was ignored in favor of 'action_url' because ${reasons} (see documentation for details)`,
            );
        }
        details_url = inputs.actionURL;
    } else if (inputs.detailsURL) {
        details_url = inputs.detailsURL;
    }

    return {
        status: inputs.status.toString(),
        output,
        conclusion: inputs.conclusion ? inputs.conclusion.toString() : undefined,
        completed_at: formatDate() ,
    };
};

const formatDate = (): string => {
    return new Date().toISOString();
};

export const createRun = async (
    octokit: InstanceType<typeof GitHub>,
    name: string,
    sha: string,
    ownership: Ownership,
    inputs: Args,
    findings: Findings): Promise<number> => {
    const {data} = await octokit.checks.create({
        ...ownership,
        head_sha: sha,
        name: name,
        started_at: formatDate(),
        ...unpackInputs(name, inputs, findings),
    });
    return data.id;
};
