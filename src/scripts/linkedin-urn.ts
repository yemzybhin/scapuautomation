import axios from 'axios';

import { env } from '@/config/env-config';

if (!env.LINKEDIN_ACCESS_TOKEN) {
  console.error('Set LINKEDIN_ACCESS_TOKEN in .env first');
  process.exit(1);
}

try {
  const response = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}` },
  });

  console.log('\nAdd this to automation/.env:\n');
  console.log(`LINKEDIN_PERSON_URN=urn:li:person:${response.data.sub}`);
} catch (error) {
  console.error(
    'Could not fetch userinfo. The token likely lacks the openid/profile scopes; regenerate it with openid, profile, and w_member_social ticked.',
  );
  console.error(axios.isAxiosError(error) ? error.response?.data : error);
  process.exit(1);
}
