import React from 'react'
import { EmailPreferenceToggle } from '../EmailPreference'
import { OrgPushNotificationToggle } from "../OrgPushNotificationToggle";
type Props = {}

const SystemConfiguration = (props: Props) => {
  return (
    <div>
      <EmailPreferenceToggle />
      <OrgPushNotificationToggle />
    </div>
  )
}

export default SystemConfiguration