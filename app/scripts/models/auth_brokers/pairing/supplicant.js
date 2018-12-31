/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import OAuthRedirectBroker from '../oauth-redirect';
import ChannelServerClient from '../../../lib/channel-server-client';
import setRemoteMetaData from './remote-metadata';
// import SupplicantStateMachine from '../../pairing/supplicant-state-machine';
import Url from '../../../lib/url';

export default class SupplicantBroker extends OAuthRedirectBroker {
  type = 'supplicant';

  initialize (options = {}) {
    super.initialize(options);

    const { config, notifier, relier } = options;

    const channelServerUrl = config.pairingChannelServerUrl;

    const { channelId, channelKey } = relier.toJSON();
    if (channelId && channelKey && channelServerUrl) {
      this.channelServerClient = new ChannelServerClient({
        channelId,
        channelKey,
        channelServerUrl,
      },
      {
        notifier,
      });

      this.listenTo(this.channelServerClient, 'change:confirmationCode', (model, value) => {
        this.set('confirmationCode', value);
      });
      //
      // this.suppStateMachine = new SupplicantStateMachine({}, {
      //   broker: this,
      //   channelServerClient: this.channelServerClient,
      //   notifier,
      //   relier
      // });

      this.channelServerClient.open();
    }
  }

  afterSupplicantApprove () {
    return Promise.resolve().then(() => {
      this.notifier.trigger('pair:supp:authorize');
    });
  }

  sendCodeToRelier () {
    return Promise.resolve().then(() => {
      const relier = this.relier;
      const result = {
        redirect: Url.updateSearchString(relier.get('redirectUri'), relier.pick('code', 'state'))
      };

      this.sendOAuthResultToRelier(result);
    });
  }

  setRemoteMetaData = setRemoteMetaData;
}
