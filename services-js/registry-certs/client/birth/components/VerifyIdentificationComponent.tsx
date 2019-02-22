import React from 'react';
import { observer } from 'mobx-react';

import { css } from 'emotion';

import {
  Radio,
  UploadPhoto,
  BLACK,
  OPTIMISTIC_BLUE_LIGHT,
} from '@cityofboston/react-fleet';

import FieldsetComponent from '../components/FieldsetComponent';
import SupportingDocumentsInput from './SupportingDocumentsInput';
import IdIcon from '../icons/IdIcon';

import UploadableFile from '../../models/UploadableFile';
import { BirthCertificateRequestInformation } from '../../types';

import { SECTION_HEADING_STYLING, SUPPORTING_TEXT_STYLING } from '../styling';

interface Props {
  requestInformation: BirthCertificateRequestInformation;
  sectionsToDisplay?: 'all' | 'supportingDocumentsOnly';
  uploadSessionId: string;
  supportingDocuments?: UploadableFile[];
  updateSupportingDocuments: (documents: UploadableFile[]) => void;
  updateIdImages: (side: string, image: any) => void;
  isComplete?: (status: boolean) => void;
  registryMessage?: string;
}

interface State {
  requireSupportingDocuments: boolean;
  hasIdFront: boolean;
  hasIdBack: boolean;
  hasDocuments: boolean;
}

/**
 * Component which allows a user to upload images and supporting files for
 * identification verification. User will also have the ability to take photos
 * with their current device, if possible.
 */

@observer
export default class VerifyIdentificationComponent extends React.Component<
  Props,
  State
> {
  state: State = {
    // If user has already submitted documents, show them when component mounts.
    requireSupportingDocuments: !!(
      this.props.supportingDocuments &&
      this.props.supportingDocuments.length > 0
    ),
    hasIdFront: false,
    hasIdBack: false,
    hasDocuments: false,
  };

  // User cannot proceed before submitting a front scan of their ID.
  // They must also submit supporting documents before proceeding, if those
  // are required.
  private checkIsComplete() {
    // const idComplete = this.state.hasIdFront && this.state.hasIdBack;

    if (!this.props.isComplete) {
      return;
    }

    if (this.props.sectionsToDisplay === 'supportingDocumentsOnly') {
      this.props.isComplete(this.state.hasDocuments);
    } else if (
      this.state.hasIdFront &&
      this.state.requireSupportingDocuments &&
      this.state.hasDocuments
    ) {
      this.props.isComplete(true);
    } else if (
      this.state.hasIdFront &&
      !this.state.requireSupportingDocuments
    ) {
      this.props.isComplete(true);
    } else {
      this.props.isComplete(false);
    }
  }

  handleSupportingDocumentsChange = (documents: UploadableFile[]): void => {
    this.setState({ hasDocuments: !!documents.length });

    this.props.updateSupportingDocuments(documents);
  };

  handleIdImageChange = (side: string, image: File | null): void => {
    if (side === 'front') {
      this.setState({ hasIdFront: !!image });
    } else if (side === 'back') {
      this.setState({ hasIdBack: !!image });
    }

    this.props.updateIdImages(side, image);
  };

  handleBooleanChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    this.setState({
      requireSupportingDocuments: event.target.value === 'yes',
    });
  };

  // Inform the parent whether or not all required information has been added
  // by the user, if necessary.
  componentDidUpdate(_prevProps: Readonly<Props>, prevState: Readonly<State>) {
    if (prevState !== this.state) {
      this.checkIsComplete();
    }
  }

  render() {
    if (this.props.sectionsToDisplay === 'supportingDocumentsOnly') {
      return this.renderSupportingDocumentsOnly();
    } else {
      return this.renderAll();
    }
  }

  renderAll() {
    const { idImageBack, idImageFront } = this.props.requestInformation;

    return (
      <>
        <h2 className={SECTION_HEADING_STYLING}>Verify your identity</h2>

        {this.props.registryMessage ? (
          <p className={SUPPORTING_TEXT_STYLING}>
            {this.props.registryMessage}
          </p>
        ) : (
          <p className={SUPPORTING_TEXT_STYLING}>
            Under state law, the record you’re ordering may have an access
            restriction. You must upload a valid form of identification before
            we can process your request.
          </p>
        )}

        <p>
          <em>Please note</em>: You must be a person or parent listed on the
          record to get a copy of the record. If you are not listed on the
          record, you will not be able to get a copy. We will cancel your
          request and will not charge your card. Contact{' '}
          <a href="mailto:birth@boston.gov">birth@boston.gov</a> with questions.
        </p>

        <h3>We accept the following forms of ID:</h3>
        <ul>
          <li>Driver’s License</li>
          <li>State ID</li>
          <li>Passport</li>
          <li>Military ID</li>
        </ul>

        <h3
          className={`${SECTION_HEADING_STYLING} secondary m-t700`}
          style={{ borderBottom: 0 }}
        >
          Upload ID images
        </h3>

        <div className="g">
          <div className="g--6 m-v500">
            <UploadPhoto
              initialFile={idImageFront ? idImageFront.file : null}
              previewHeight={205}
              uploadProgress={idImageFront && idImageFront.progress}
              errorMessage={idImageFront && idImageFront.errorMessage}
              handleDrop={file => this.handleIdImageChange('front', file)}
              handleRemove={() => this.handleIdImageChange('front', null)}
              backgroundElement={<IdImage name="front" />}
              buttonTitleUpload="Upload front of ID"
            />
          </div>

          <div className="g--6 m-v500">
            <UploadPhoto
              initialFile={idImageBack ? idImageBack.file : null}
              previewHeight={205}
              uploadProgress={idImageBack && idImageBack.progress}
              errorMessage={idImageBack && idImageBack.errorMessage}
              handleDrop={file => this.handleIdImageChange('back', file)}
              handleRemove={() => this.handleIdImageChange('back', null)}
              backgroundElement={<IdImage name="back" />}
              buttonTitleUpload="Upload back of ID"
            />
          </div>
        </div>

        <FieldsetComponent
          legendText={
            <h3
              className={`${SECTION_HEADING_STYLING} secondary m-t700`}
              style={{ borderBottom: 0 }}
            >
              Have you had a legal name change or do you have court
              guardianship?
            </h3>
          }
        >
          <Radio
            name="no"
            value="no"
            label="No"
            checked={!this.state.requireSupportingDocuments}
            onChange={this.handleBooleanChange}
          />
          <Radio
            name="yes"
            value="yes"
            label="Yes"
            checked={this.state.requireSupportingDocuments}
            onChange={this.handleBooleanChange}
          />

          {this.state.requireSupportingDocuments &&
            this.renderSupportingDocumentsInput()}
        </FieldsetComponent>

        <h2 className={`${SECTION_HEADING_STYLING} secondary m-t700`}>
          No ID?
        </h2>

        <p className={`${SUPPORTING_TEXT_STYLING} m-b700`}>
          We can help explain your options.{' '}
          <a>
            Request help <span aria-hidden="true">→</span>
          </a>
        </p>
      </>
    );
  }

  renderSupportingDocumentsOnly() {
    return (
      <>
        <h2 className={SECTION_HEADING_STYLING}>Upload supporting documents</h2>

        <p>
          We need more information. If you have questions, contact{' '}
          <a href="mailto:birth@boston.gov">birth@boston.gov</a>.
        </p>

        {this.props.registryMessage && <p>{this.props.registryMessage}</p>}

        {this.renderSupportingDocumentsInput()}
      </>
    );
  }

  renderSupportingDocumentsInput() {
    return (
      <div className="m-t700">
        <p>Files should be PDF format, and under 10MB each.</p>

        <SupportingDocumentsInput
          uploadSessionId={this.props.uploadSessionId}
          selectedFiles={this.props.supportingDocuments || []}
          handleInputChange={this.handleSupportingDocumentsChange}
        />
      </div>
    );
  }
}

function IdImage(props: { name: string }): JSX.Element {
  return (
    <div className={`${PREVIEW_IMAGE_STYLING} id`}>
      <IdIcon side={props.name} />
    </div>
  );
}

const PREVIEW_IMAGE_STYLING = css({
  backgroundColor: OPTIMISTIC_BLUE_LIGHT,
  color: BLACK,

  '&.id': {
    padding: '2rem 4rem',
  },
});
