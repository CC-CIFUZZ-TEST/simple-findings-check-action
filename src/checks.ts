import {GitHub} from '@actions/github/lib/utils';
import {Args} from './namespaces/Inputs';
import {Finding, Findings} from './namespaces/findings';
import {CheckAnnotation} from "./namespaces/CheckAnnotation";

type Ownership = {
    owner: string;
    repo: string;
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


const unpackInputs = (title: string, inputs: Args, findings: Findings): Record<string, unknown> => {
    return {
        status: "",
        output: {
            title,
            summary: findings.findings.length + " Findings found",
            text: "",
            annotations: getFindingsStringArray(findings),
        },
        conclusion: "",
        completed_at: formatDate(),
    };
};

const formatDate = (): string => {
    return new Date().toISOString();
};

function getFindingsStringArray(findings: Findings): CheckAnnotation[] {
    let findingsArray: CheckAnnotation[] = []
    findings.findings.forEach(finding => {
        findingsArray.push(getFindingsString(finding))
    })
    return findingsArray
}

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
