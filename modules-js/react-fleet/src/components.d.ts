/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 *
 *
 * Modified when copying into the monorepo:
 *  - Changed "@stencil/core" import to 'import React from 'react';'
 *  - Changed HTMLAttributes to extend React.HTMLAttributes<HTMLElement>
 */
/* tslint:disable */

import React from 'react';

declare global {
  interface HTMLElement {
    componentOnReady?: () => Promise<this | null>;
  }

  interface HTMLStencilElement extends HTMLElement {
    componentOnReady(): Promise<this>;

    forceUpdate(): void;
  }

  interface HTMLAttributes extends React.HTMLAttributes<HTMLElement> {}

  namespace StencilComponents {
    interface CobChart {
      config: any;
    }

    interface CobContactForm {
      /**
       * Defaults to `https://contactform.boston.gov/emails` but can be set for development testing.
       */
      action: string;
      /**
       * Pre-fills the subject field in the form.
       */
      defaultSubject: string;
      /**
       * Hide the modal.
       */
      hide: () => void;
      /**
       * Show the modal.
       */
      show: () => void;
      /**
       * Email address to send the form contents to. Defaults to **feedback@boston.gov**.
       */
      to: string;
      /**
       * HTTP Authorization header token. Needs to match an API token in the `contactform.boston.gov` database.
       */
      token: string;
      /**
       * Whether or not the modal is shown. Defaults to hidden.
       */
      visible: boolean;
    }

    interface CobMap {
      /**
       * A JSON string or equivalent object that defines the map and layers. The schema for this config comes from VizWiz, so it won’t be documented here.  Any attributes prefixed with `map-` will be passed on to the generated `<cob-map>` component. _E.g._ `map-id` or `map-style`.
       */
      config: string;
      /**
       * Hides the modal, if the map is in modal mode.
       */
      hide: () => void;
      /**
       * ID of the HTML element. Used to automatically open the map modal.
       */
      id: string;
      /**
       * Change to true to make the modal appear.
       */
      modalVisible: boolean;
      /**
       * Test attribute to make the overlay open automatically at mobile widths. Only used so that we can take Percy screenshots of the overlay.
       */
      openOverlay: boolean;
      /**
       * Shows the modal, if the map is in modal mode.
       */
      show: () => void;
      /**
       * If the map is in modal mode, toggles whether or not it’s visible.
       */
      toggle: () => void;
    }
  }

  interface HTMLCobChartElement
    extends StencilComponents.CobChart,
      HTMLStencilElement {}

  var HTMLCobChartElement: {
    prototype: HTMLCobChartElement;
    new (): HTMLCobChartElement;
  };

  interface HTMLCobContactFormElement
    extends StencilComponents.CobContactForm,
      HTMLStencilElement {}

  var HTMLCobContactFormElement: {
    prototype: HTMLCobContactFormElement;
    new (): HTMLCobContactFormElement;
  };

  interface HTMLCobMapElement
    extends StencilComponents.CobMap,
      HTMLStencilElement {}

  var HTMLCobMapElement: {
    prototype: HTMLCobMapElement;
    new (): HTMLCobMapElement;
  };

  namespace JSX {
    interface Element {}
    export interface IntrinsicElements {
      'cob-chart': JSXElements.CobChartAttributes;
      'cob-contact-form': JSXElements.CobContactFormAttributes;
      'cob-map': JSXElements.CobMapAttributes;
    }
  }

  namespace JSXElements {
    export interface CobChartAttributes extends HTMLAttributes {
      config?: any;
    }

    export interface CobContactFormAttributes extends HTMLAttributes {
      /**
       * Defaults to `https://contactform.boston.gov/emails` but can be set for development testing.
       */
      action?: string;
      /**
       * Pre-fills the subject field in the form.
       */
      defaultSubject?: string;
      /**
       * Email address to send the form contents to. Defaults to **feedback@boston.gov**.
       */
      to?: string;
      /**
       * HTTP Authorization header token. Needs to match an API token in the `contactform.boston.gov` database.
       */
      token?: string;
      /**
       * Whether or not the modal is shown. Defaults to hidden.
       */
      visible?: boolean;
    }

    export interface CobMapAttributes extends HTMLAttributes {
      /**
       * A JSON string or equivalent object that defines the map and layers. The schema for this config comes from VizWiz, so it won’t be documented here.  Any attributes prefixed with `map-` will be passed on to the generated `<cob-map>` component. _E.g._ `map-id` or `map-style`.
       */
      config?: string;
      /**
       * ID of the HTML element. Used to automatically open the map modal.
       */
      id?: string;
      /**
       * Change to true to make the modal appear.
       */
      modalVisible?: boolean;
      /**
       * Test attribute to make the overlay open automatically at mobile widths. Only used so that we can take Percy screenshots of the overlay.
       */
      openOverlay?: boolean;
    }
  }

  interface HTMLElementTagNameMap {
    'cob-chart': HTMLCobChartElement;
    'cob-contact-form': HTMLCobContactFormElement;
    'cob-map': HTMLCobMapElement;
  }

  interface ElementTagNameMap {
    'cob-chart': HTMLCobChartElement;
    'cob-contact-form': HTMLCobContactFormElement;
    'cob-map': HTMLCobMapElement;
  }
}
declare global {
  namespace JSX {
    interface StencilJSX {}
  }
}
