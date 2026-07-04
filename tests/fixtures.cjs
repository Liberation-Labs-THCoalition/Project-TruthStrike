// Test fixtures: representative texts with expected score bands.
// All propaganda samples are synthetic — written to exercise technique
// detectors, not copied from any real post.

module.exports = [
  {
    name: 'rage-bait multi-pathway propaganda',
    expect: { min: 50 },
    text: `
WAKE UP AMERICA!!! They are coming for you and your family and NOBODY in the
mainstream media will tell you the truth. Everyone knows what's really going on
— millions of Americans are finally waking up while the sheep keep drinking the
kool-aid. These people HATE you. They hate everything real Americans stand for,
and they are taking over our towns, our schools, our country. This is the most
important fight of our lifetimes: if we lose this, it's over — the end of
America as we know it. Only one man can stop what's coming, and that's exactly
what they don't want you to know. The elites and their globalist agenda have
been poisoning our nation for decades. Share this NOW before it's too late,
while you still can. If you're one of the few who can still think for
yourself, you already know it's true. There is no doubt whatsoever. FACT: crime
is up 300% and they did it on purpose. What are they hiding? Why is nobody
talking about this? Wake up. Act now. Before it's too late.`
  },
  {
    name: 'fear + urgency conspiracy short post',
    expect: { min: 25 },
    text: `
They're about to pull the trigger on something huge and the media is DEAD
silent. What they don't want you to know could destroy everything. Do your own
research before it's too late — nowhere is safe. Share this while you still can!!!`
  },
  {
    name: 'fact-check article debunking a false claim (MUST stay low)',
    expect: { max: 24 },
    text: `
A viral post claiming that "they are coming for your children" and that crime
is "up 300%" has been rated False by three independent fact-checking
organizations. The post, which urged readers to "wake up before it's too
late," provided no evidence for its central claim. According to FBI Uniform
Crime Reporting data released in March, violent crime declined 6.1% compared
to the same period a year earlier. Dr. Elena Vasquez, a criminologist at the
University of Michigan who reviewed the data for Reuters, said the viral
figure appears to be fabricated. "There is no dataset in which this number
appears," Vasquez said. PolitiFact traced the claim to a network of accounts
that researchers at Stanford identified as part of a coordinated campaign.
Similar baseless claims about "invasion" and "replacement" have circulated
since 2019 and have been repeatedly debunked. The conspiracy theory relies on
misinformation about census methodology, experts interviewed by the
Associated Press said. Readers can review the underlying crime statistics,
published at https://cde.ucr.cjis.gov, and compare them with the claims made
in the post.`
  },
  {
    name: 'straight news report with named sources and baselines',
    expect: { max: 20 },
    text: `
The city council voted 7-2 on Tuesday to approve a $12 million bond for road
repairs, up from $8 million in last year's budget. Councilmember Maria Chen,
who sponsored the measure, said the increase reflects deferred maintenance on
43 of the city's 220 miles of arterial roads. "We are catching up on a decade
of underinvestment," Chen said during the public hearing. The measure drew
support from the local chamber of commerce and opposition from two
neighborhood associations, whose representatives argued the bond should
include sidewalk repairs. City engineer David Okafor told the council that
per-mile repaving costs rose 14% compared to 2024, citing asphalt prices. The
bond will appear on the November ballot. A simple majority is required for
passage, according to the county elections office.`
  },
  {
    name: 'heated but evidenced op-ed (should stay below high band)',
    expect: { max: 49 },
    text: `
The governor's veto is a disgrace, and voters should be furious. According to
the state's own Legislative Fiscal Bureau analysis published in June, the
vetoed bill would have cut childhood lead exposure in Milwaukee by an
estimated 30% compared to current remediation rates, at a cost of $40 per
resident — less than the state spent on stadium subsidies last year. Dr.
Samuel Reed of the Medical College of Wisconsin testified before the
committee that lead exposure in the affected zip codes remains four times the
national average, per CDC surveillance data. Court records from the 2023
settlement show the state acknowledged the scope of the problem. This was a
funded, evidence-backed program with bipartisan sponsorship, and the veto
abandons roughly 9,000 children, out of the 31,000 screened annually, to a
hazard we know how to fix. Call your legislator and demand an override vote.`
  },
  {
    name: 'bland product review',
    expect: { max: 12 },
    text: `
I've used this kettle daily for about three months. It boils a full liter in
just over four minutes, which is slower than my old stovetop kettle but fine
for morning coffee. The handle stays cool and the lid seals well. Two
complaints: the water level window is hard to read, and the lid requires more
force to open than it should. Compared to the previous model, the base feels
sturdier. At this price I'd buy it again, though if you make tea for a crowd
you may want the 1.7 liter version instead.`
  },
  {
    name: 'insider-knowledge + consensus-faking social post',
    expect: { min: 25 },
    text: `
The hidden truth is finally coming out and everybody knows it. People are
saying this is the biggest cover-up in history — the story they tried to bury.
You won't see this anywhere else, folks. Smart people have already connected
the dots. It's just common sense. Only an idiot would still believe the
official story at this point. The awakened few have known for years what's
really happening behind closed doors.`
  },
  {
    name: 'science news about climate (topic words must NOT trigger)',
    expect: { max: 20 },
    text: `
Global average surface temperature in 2025 was 1.46 degrees Celsius above the
pre-industrial baseline, according to the annual assessment published by the
World Meteorological Organization on Thursday. The figure is down slightly
from 2024's record of 1.55 degrees, a difference the report attributes to the
transition from El Niño to La Niña conditions in the tropical Pacific. Dr.
Friederike Otto of Imperial College London, who was not involved in the
report, said the year-to-year variation does not change the long-term trend
of roughly 0.2 degrees of warming per decade. Ocean heat content, measured to
a depth of 2,000 meters, set a new record for the eighth consecutive year,
the report found. The dataset and methodology are available at
https://wmo.int/state-of-climate. Climate change and climate hoax claims were
not addressed in the technical report, which focuses on observational data.`
  },
  {
    name: 'menace construction / dehumanization sample',
    expect: { min: 40 },
    text: `
This is an invasion, plain and simple. The horde flooding across isn't coming
to join us — these people are coming to replace us, and the traitors in
charge are letting it happen on purpose. They're poisoning the blood of our
nation while the enemy within opens the gates. Real Americans see predators
everywhere: in our schools, in our neighborhoods, preying on our children
while the corporate media stays silent. If you're not with us, you're one of
them. Our country is being destroyed and this is our last chance to save it.`
  }
];
