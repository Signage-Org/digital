import React from 'react';
import { storiesOf } from '@storybook/react';

import BirthCertificateRequest from '../store/BirthCertificateRequest';

import ReviewRequestPage from './ReviewRequestPage';

import { BirthCertificateRequestInformation } from '../types';

const birthCertRequest: BirthCertificateRequestInformation = {
  forSelf: true,
  howRelated: '',
  bornInBoston: 'yes',
  parentsLivedInBoston: '',
  firstName: 'Martin',
  lastName: 'Walsh',
  altSpelling: '',
  birthDate: new Date(Date.UTC(1967, 3, 10)),
  parentsMarried: '',
  parent1FirstName: 'Martin',
  parent1LastName: '',
  parent2FirstName: '',
  parent2LastName: '',
  idImageBack: null,
  idImageFront: null,
  supportingDocuments: [],
};

const birthCertificateRequest = new BirthCertificateRequest();

birthCertificateRequest.answerQuestion(birthCertRequest);

storiesOf('Birth/ReviewRequestPage', module).add('default page', () => (
  <ReviewRequestPage
    birthCertificateRequest={birthCertificateRequest}
    siteAnalytics={{ addProduct: () => {}, setProductAction: () => {} } as any}
  />
));
