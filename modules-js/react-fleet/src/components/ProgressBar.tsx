import React from 'react';

import { css } from 'emotion';

import { CHARLES_BLUE, OPTIMISTIC_BLUE } from '../utilities/constants';

interface Props {
  steps: string[];
  currentStep: string;
  currentStepCompleted?: boolean;
  showStepName?: boolean;
}

/**
 * Component used to indicate a user’s progress through a number of tasks.
 *
 * Displays current step number in relation to total number of steps
 * below the visual progress indicator.
 *
 * When the current step is completed, the progress bar will grow i.e:
 * when the user begins, the visual progress bar shows no progress. Once the
 * user performs the task, the visual progress bar will grow; see the
 * react-fleet Storybook for an interactive demonstration of this behavior.
 *
 * “showStepName” property may be used to additionally display the name of
 * the current task.
 */
export default function ProgressBar(props: Props): JSX.Element {
  const totalSteps = props.steps.length;
  const currentIndex = props.steps.indexOf(props.currentStep);
  const currentStepNumber = props.steps.indexOf(props.currentStep) + 1;
  let progressText = `Step ${currentStepNumber} of ${totalSteps}`;

  if (props.showStepName) {
    progressText = progressText + `: ${props.currentStep}`;
  }

  return (
    <div className={PROGRESS_BAR_STYLE}>
      <progress
        max={totalSteps}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStepNumber}
        aria-valuetext={progressText}
        value={props.currentStepCompleted ? currentStepNumber : currentIndex}
      >
        {progressText}
      </progress>

      {/* hidden from screenreaders to avoid repetition */}
      <span aria-hidden="true">{progressText}</span>
    </div>
  );
}

const PROGRESS_BAR_STYLE = css({
  progress: {
    margin: '1rem 0 0.25rem',
    width: '100%',
    height: '1rem',
    border: `2px solid ${CHARLES_BLUE}`,
    backgroundColor: '#fff',

    '::-webkit-progress-bar': {
      backgroundColor: '#fff',
    },

    '::-webkit-progress-value': {
      transition: 'width 0.5s',

      backgroundColor: OPTIMISTIC_BLUE,
    },

    '::-moz-progress-bar': {
      backgroundColor: OPTIMISTIC_BLUE,
    },

    '::-ms-fill': {
      backgroundColor: OPTIMISTIC_BLUE,
    },
  },

  span: {
    fontStyle: 'italic',
  },
});
