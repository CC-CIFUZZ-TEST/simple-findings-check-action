import {RestEndpointMethodTypes} from '@octokit/rest';

export interface Args {
  repo?: string;
  token: string;
  ciFuzzToken: string;
  name: string;
}
