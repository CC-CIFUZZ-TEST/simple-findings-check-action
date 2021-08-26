import {GitHub} from '@actions/github/lib/utils';
import * as core from '@actions/core';
import * as Inputs from './namespaces/Inputs';
import {Findings} from './namespaces/findings';
import {Args} from "./namespaces/Inputs";

type Ownership = {
  owner: string;
  repo: string;
};

const unpackInputs = (title: string, inputs: Args, findings: string): Record<string, unknown> => {
  let output;
  if (inputs.output) {
    output = {
      title,
      summary: findings+" Findings found",
      text: inputs.output.text_description,
      actions: inputs.actions,
      // annotations: inputs.annotations,
      annotations: [
          {"path":"webgoat-container/src/main/java/org/owasp/webgoat/controller/StartLesson.java",
            "annotation_level":"warning",
            "title":"Exception Policy Violation : org.owasp.webgoat.all_controllers",
            "message":"{\"requests\":[{\"method\":\"GET\",\"uri\":\"/*.lesson\",\"webControllerId\":\"1415976645\"}]}",
            "raw_details":"An Exception policy violation occurs when an exception is thrown during the fuzzing process that \n" +
                "was not expected. Expected exceptions are defined by the Fuzzing Policy provided by the user. The Fuzzing Policy \n" +
                "contains a list of matchers for allowed exceptions during the fuzzing process, and this exception did not match any. Details \n" +
                "about the exception can be found in the log below.",
            "start_line":86,
            "end_line":86},
        {"path":"webgoat-container/src/main/java/org/owasp/webgoat/users/UserValidator.java",
          "annotation_level":"failure",
          "title":"Exception Policy Violation : org.owasp.webgoat.all_controllers",
          "message":"{\"requests\":[{\"method\":\"POST\",\"uri\":\"/register.mvc\",\"contentType\":\"APPLICATION_JSON\",\"body\":\"{}\",\"webControllerId\":\"382221417\"}]}",
          "raw_details": "An Exception policy violation occurs when an exception is thrown during the fuzzing process that \n" +
              "was not expected. Expected exceptions are defined by the Fuzzing Policy provided by the user. The Fuzzing Policy \n" +
              "contains a list of matchers for allowed exceptions during the fuzzing process, and this exception did not match any. Details \n" +
              "about the exception can be found in the log below.",
          "start_line":31,
          "end_line":31}
      ],
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
    inputs: Args,
    findings: string): Promise<number> => {
  const {data} = await octokit.checks.create({
    ...ownership,
    head_sha: sha,
    name: name,
    started_at: formatDate(),
    ...unpackInputs(name, inputs,findings),
  });
  return data.id;
};
