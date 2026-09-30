import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy for calpush, a personal tool by Andy Zhang.',
}

const UPDATED = 'September 29, 2026'
const CONTACT = 'zhangandy.all@gmail.com'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="headline mb-2 text-[30px]">Privacy Policy</h1>
      <p className="text-sm text-muted mb-8">
        calpush, a personal tool by Andy Zhang. Last updated {UPDATED}.
      </p>

      <div className="space-y-6 text-[16px] leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">What calpush is</h2>
          <p>
            calpush is a small command-line tool that copies my own school schedule into my own
            Google Calendar and Google Tasks. It is a personal project. It is not offered to
            anyone else and has no other users.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">What it accesses</h2>
          <p>
            With my permission, calpush can read, create, edit and delete events in Google
            Calendar and items in Google Tasks. It does this for one Google account: mine.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Where the data goes</h2>
          <p>
            The tool runs on my own computer and keeps its login in a file there. It sends data
            only between my computer and Google. It does not collect, sell, share or transmit
            information to any other person, server or service, and it has no analytics,
            advertising or tracking. I sometimes run it with the help of AI coding assistants on
            my own computer; the tool itself still sends data only to Google.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Keeping and deleting data</h2>
          <p>
            calpush stores nothing except that login file. Deleting the file removes the login
            from my computer. Access can be revoked at any time at{' '}
            <a
              href="https://myaccount.google.com/permissions"
              className="underline"
              rel="noopener noreferrer"
            >
              myaccount.google.com/permissions
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Google API Services User Data Policy</h2>
          <p>
            calpush&apos;s use and transfer of information received from Google APIs adheres to
            the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="underline"
              rel="noopener noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">Contact</h2>
          <p>
            Questions:{' '}
            <a href={`mailto:${CONTACT}`} className="underline">
              {CONTACT}
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
