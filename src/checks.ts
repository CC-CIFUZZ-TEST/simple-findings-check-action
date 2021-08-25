import {GitHub} from '@actions/github/lib/utils';
import * as core from '@actions/core';
import * as Inputs from './namespaces/Inputs';

type Ownership = {
  owner: string;
  repo: string;
};

const unpackInputs = (title: string, inputs: Inputs.Args): Record<string, unknown> => {
  let output;
  if (inputs.output) {
    output = {
      title,
      summary: inputs.output.summary,
      text: inputs.output.text_description,
      actions: inputs.actions,
      // annotations: inputs.annotations,
      annotations: '[{“path”:“README.md”,“annotation_level”:“warning”,“title”:“Spell Checker”,“message”:“Check your spelling for ‘banaas’.“,”raw_details”:“Do you mean ‘bananas’ or ‘banana’?“,”start_line”:1,“end_line”:2}]',
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
    actions: inputs.actions,
    conclusion: inputs.conclusion ? inputs.conclusion.toString() : undefined,
    completed_at: inputs.status === Inputs.Status.Completed ? formatDate() : undefined,
    details_url,
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
  inputs: Inputs.Args,
): Promise<number> => {
  const {data} = await octokit.checks.create({
    ...ownership,
    head_sha: sha,
    name: name,
    started_at: formatDate(),
    ...unpackInputs(name, inputs),
  });
  return data.id;
};
