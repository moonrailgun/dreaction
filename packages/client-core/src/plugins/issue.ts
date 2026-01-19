import type { DReactionCore, Plugin, InferFeatures } from '../types';
import { createPluginGuard } from '../utils/plugin-guard';

/**
 * Provides issue reporting feature
 */
const issue = () => (dreaction: DReactionCore) => {
  return {
    features: {
      reportIssue: (id: string, name?: string, description?: string) => {
        dreaction.send('report.issue', { id, name, description }, true);
      },
    },
  } satisfies Plugin<DReactionCore>;
};

export default issue;

export type IssuePlugin = ReturnType<typeof issue>;
export type IssueFeatures = InferFeatures<ReturnType<typeof issue>>;

const issueGuard = createPluginGuard<IssueFeatures>(['reportIssue'], 'issue');

export const hasIssuePlugin = issueGuard.has;
export const assertHasIssuePlugin = issueGuard.assert;
