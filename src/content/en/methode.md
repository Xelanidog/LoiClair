# Indicator Methodology

This page details how each indicator is calculated, where the data comes from, and what they do not measure.

---

## Taux de promulgation

**What it measures**
This rate indicates what share of texts that were intended to become laws were actually enacted by the President of the Republic. It is a global indicator of the effectiveness of the legislative process.

**How it is calculated**
> Enactment rate = (Number of enacted texts ÷ Number of legislative texts) × 100

Numerical example: if 120 texts have been enacted out of 400 legislative texts, the rate is 30%.

**Included** variables:
- **Enacted texts** (numerator): all dossiers whose status indicates that they have been enacted — that is, signed by the President and published in the Official Journal.
- **Legislative texts** (denominator): dossiers whose procedure type is designed to result in a law. This includes ordinary government bills and private members' bills, constitutional laws, organic laws, finance laws (initial and supplementary), social security funding laws, and treaty and convention ratifications.

**Excluded** variables and why:
- Resolutions, petitions, fact-finding missions, committees of inquiry, information reports, addresses and government confidence votes are excluded from the denominator. These texts are not intended to be enacted as laws — counting them would skew the rate downward.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night. The period covered is the entire 17th legislature.

**What it does not measure**
⚠ This rate does not reflect the quality or importance of the laws enacted. A high rate means that many tabled texts succeed, not that the legislative activity is of high quality.

⚠ Texts still under examination are not counted as enacted. The current rate is therefore provisional and will increase as ongoing dossiers are concluded.

**How to interpret**
A rate of 30% means that approximately 1 in 3 texts intended to become a law actually does so. This figure can vary significantly depending on the filters applied (procedure type, initiating political group).

---

## Taux d'application

**What it measures**
This rate indicates what share of legislative texts are actually applied — that is, in force in citizens' daily lives. An enacted law is not always sufficient: many require implementing decrees to come into force. This indicator measures the gap between laws voted and laws that are actually operational.

**How it is calculated**
> Application rate = (Number of applied laws ÷ Number of legislative texts) × 100

Numerical example: if 62 laws are applied out of 1,985 legislative texts, the rate is 3.1%.

1. The same denominator as the enactment rate is used (legislative texts). This allows both rates to be read as progression: for example, 5% of texts are enacted, and of those, 3% are actually applied.
2. A law is considered **applied** in two cases:
   - **Direct application**: the law applies immediately without the need for supplementary decrees.
   - **Fully applied**: all expected implementing decrees have been published in the Official Journal.

**Included** variables:
- **Applied laws** (numerator): enacted laws whose application status is "applied" (all decrees published) or "direct application" (no decree necessary).
- **Legislative texts** (denominator): identical to the enactment rate — government bills, private members' bills, constitutional laws, organic laws, finance laws, etc.

**Excluded** variables and why:
- "Partially applied" laws (some decrees published, others not) are not counted as applied. Only full application is retained.
- Laws whose status is "without object" (for example, repealed before application) are excluded.

**Where the data comes from**
The application status comes from the Law Application Barometer published by the National Assembly, cross-referenced with Légifrance data. Data is updated regularly. The period covered is the 17th legislature.

**What it does not measure**
⚠ This rate says nothing about the quality or real impact of applied laws. A law may be technically applied (decrees published) but poorly implemented in practice.

⚠ The denominator includes all legislative texts, including those still under examination. The rate will mechanically increase as more laws are enacted and then applied.

**How to interpret**
A significant gap between the enactment rate and the application rate reveals a "regulatory bottleneck": laws voted but awaiting their decrees to come into force. The closer the two rates are, the better the legislative chain functions from end to end.

---

## Délai moyen d'application

**What it measures**
The average time, in days, between the enactment of a law and the publication of the last implementing decree necessary for its full implementation. This indicator reveals how long it takes, after a law is voted, for it to be truly operational.

**How it is calculated**
> Delay for a text = Date of the last implementing decree published − Date of enactment (in days)
> Average delay = Sum of all delays ÷ Number of laws concerned

Numerical example: if a law is enacted on 1 January and its last decree is published on 1 July, the delay is 181 days. The average delay is the mean of all these delays.

1. Only laws **requiring decrees** and **fully applied** are taken into account. Laws with direct application are excluded because they have no application delay (they apply immediately).
2. The delay used is that of the **last** decree published (not the first), because it is that one which marks the full application of the law.

**Included** variables:
- Enacted laws whose status is "applied" (all decrees published).
- The delay measured is that between enactment and publication of the last decree.

**Excluded** variables and why:
- Laws with direct application are excluded: without a necessary decree, their application delay is by definition zero, which would skew the average downward.
- Partially applied or unapplied laws are excluded because their application process is not complete.

**Where the data comes from**
Application delays come from the Law Application Barometer published by the National Assembly, cross-referenced with Légifrance data. The period covered is the 17th legislature.

**What it does not measure**
⚠ The average is sensitive to extreme cases. A law whose decrees are published in 3 months pulls the average down as much as a law waiting for its decrees for 2 years pulls it up. The minimum and maximum values displayed allow this spread to be visualised.

⚠ This delay does not measure the speed of effective implementation in the field, only the official publication of decrees.

**How to interpret**
A delay of less than 6 months (180 days) is considered fast for the publication of implementing decrees. A delay of more than one year signals that the law took a long time to become fully operational, often due to the technical complexity of the decrees to be drafted or political constraints.

---

## Délai moyen de promulgation

**What it measures**
The average time, in days, between the official tabling of a text in Parliament and its signature (enactment) by the President of the Republic. This is an overall measure of the speed of the legislative process from end to end.

**How it is calculated**
> Delay for a text = Date of enactment − Date of tabling (in days)
> Average delay = Sum of all delays ÷ Number of enacted texts

Numerical example: a text tabled on 1 January and enacted on 1 July has a delay of 181 days. The average delay is the mean of all these delays across all enacted texts.

**Included** variables:
- **Tabling date**: the date on which the text was officially tabled in Parliament.
- **Enactment date**: the date on which the President of the Republic signed the law.

**Excluded** variables and why:
- Only texts that have both a tabling date and an enactment date are taken into account. Texts still under examination, rejected, or without a complete date are excluded because their end-to-end delay cannot be calculated.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ The average is sensitive to extreme cases. A text tabled and enacted in 10 days (national emergency) pulls the average down as much as a text blocked for 5 years pulls it up. The minimum and maximum values displayed alongside the average allow this spread to be visualised.

⚠ This indicator does not distinguish between accelerated and ordinary procedures. For finer analysis, use the procedure type filter.

**How to interpret**
A delay of less than 100 days is typical of an accelerated procedure (declared urgency). A delay of 300 to 600 days corresponds to a complete ordinary legislative procedure. Beyond 600 days, the text has generally gone back and forth between the two chambers several times.

---

## Délai moyen à l'Assemblée nationale

**What it measures**
The time elapsed, in days, between the tabling of a text at the National Assembly and the adoption decision by that chamber. This indicator isolates the working speed specific to the National Assembly, independently of the Senate.

**How it is calculated**
> National Assembly delay for a text = Date of the adoption decision at the National Assembly − Date of tabling at the National Assembly (in days)
> Average delay = Sum of all delays ÷ Number of texts adopted at the National Assembly

Numerical example: a text tabled at the National Assembly on 1 March and adopted on 30 April has a delay of 60 days.

**Included** variables:
- **Date of tabling at the National Assembly**: the date on which the text was officially registered at the Assembly. When a text makes several passes, the first tabling date is used.
- **Date of adoption at the National Assembly**: the date on which the Assembly made a favourable decision on the text (adoption, adoption with modifications, final adoption). The first favourable decision is retained.

**Excluded** variables and why:
- Dossiers without an adoption decision at the National Assembly are excluded (texts tabled but not yet voted on, or rejected).
- In the case of multiple readings (parliamentary shuttle), only the first tabling and the first adoption are retained, to measure the complete cycle of the first shuttle.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ This delay covers the entire journey at the National Assembly (including committee work), but does not reflect the depth of debate or the number of amendments examined.

⚠ A very short delay may indicate an emergency procedure or a vote without thorough debate, not necessarily a more efficient examination.

**How to interpret**
A delay of less than 30 days often reflects an emergency procedure. Between 1 and 3 months, the procedure is fast but normal. More than 6 months generally indicates a complex or controversial text.

---

## Délai moyen au Sénat

**What it measures**
The time elapsed, in days, between the tabling of a text at the Senate and the adoption decision by that chamber. Same logic as the National Assembly delay, but for the upper chamber.

**How it is calculated**
> Senate delay for a text = Date of the adoption decision at the Senate − Date of tabling at the Senate (in days)
> Average delay = Sum of all delays ÷ Number of texts adopted at the Senate

Numerical example: a text tabled at the Senate on 15 January and adopted on 15 April has a delay of 90 days.

**Included** variables:
- **Date of tabling at the Senate**: the date on which the text was officially registered at the Senate. When a text makes several passes, the first tabling date is used.
- **Date of adoption at the Senate**: the date on which the Senate made a favourable decision on the text. The first favourable decision is retained.

**Excluded** variables and why:
- Dossiers without an adoption decision at the Senate are excluded.
- ⚠ **Exception**: the "Right to vote for foreigners" (Droit de vote des étrangers) dossier is excluded from the calculation. This text was tabled in 2000 and remained blocked in the Senate for 11 years for political reasons. Its delay of more than 4,000 days constitutes a unique outlier that would heavily distort the average.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ This delay covers the entire journey at the Senate (including committee work), but does not reflect the depth of debate or the number of amendments examined.

**How to interpret**
Senate delays tend to be slightly longer than at the National Assembly, due to the upper chamber's own working rhythm and its session periods. A Senate delay of 2 to 4 months is common for an ordinary text.

---

## Succès législatif par groupe politique

**What it measures**
For each political group that has initiated at least 10 dossiers, this indicator compares three rates: their adoption rate at the National Assembly, at the Senate, and their enactment rate. It is a measure of the relative legislative effectiveness of political groups.

**How it is calculated**
Three rates are calculated for each group:

> Adoption rate at the National Assembly = (Group's texts adopted at the National Assembly ÷ Total relevant texts of the group for the National Assembly) × 100

> Adoption rate at the Senate = (Group's texts adopted at the Senate ÷ Total relevant texts of the group for the Senate) × 100

> Enactment rate = (Group's enacted texts ÷ Total legislative texts of the group) × 100

Numerical example: if a group has tabled 50 relevant texts for the National Assembly and 15 have been adopted, its adoption rate is 30%.

**Included** variables:
- **Texts initiated by a group**: dossiers whose initiating political group corresponds to the group being analysed.
- **Total relevant for the National Assembly**: all the group's texts, except those that are not subject to a vote at the National Assembly (petitions, addresses, committees of inquiry, fact-finding missions, information reports).
- **Total relevant for the Senate**: same logic, with the additional exclusion of resolutions and government confidence votes, which do not go to the Senate.
- **Total legislative**: texts whose procedure is designed to result in a law (same list as for the overall enactment rate).

**Excluded** variables and why:
- Groups that have initiated **fewer than 10 dossiers** are excluded. With so few texts, percentages are not significant — a single text adopted or rejected would move the rate by 10 to 100%, which would be misleading.

**Aggregation of governments**
All governments of the legislature (current and former) are merged into a single "Government" line. Former governments remain present in the data because some dossiers they tabled are still active — re-tabled texts or multi-legislature procedures still in progress. This aggregation avoids displaying several "Government" lines with fragmented statistics and gives a more readable overview of government action.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ This table compares groups that do not operate under the same conditions. A majority group naturally sees more of its texts adopted than an opposition group, because it is the majority that votes the law. A low adoption rate for the opposition does not mean that this group works less well — it reflects an arithmetic reality of the democratic game.

⚠ The enactment rate is not directly comparable between the majority and the opposition. It must be interpreted taking into account each group's position within or outside the government coalition.

**How to interpret**
For majority government groups, an enactment rate above 40% is high. For an opposition group, any text adopted and enacted is notable and deserves attention. The table is clickable: sorting by "% Enactment" allows you to compare the final effectiveness of each group; sorting by "% Adoption National Assembly" or "% Adoption Senate" gives an overview of their chamber-by-chamber influence.

---

## Parité femmes

**What it measures**
The percentage of women among the serving members of an institution (National Assembly, Senate or Government). It is an indicator of gender representativeness.

**How it is calculated**
> Female parity = (Number of women ÷ Total number of serving members) × 100

Numerical example: if an institution has 577 members of whom 215 are women, the parity is 37%.

**Included** variables:
- **Number of women**: members whose title is "Mme".
- **Total number of members**: all members currently serving in the relevant institution.

**Excluded** variables and why:
- Former members (who are no longer serving) are not counted. The indicator reflects the current composition, not the historical record.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ This percentage says nothing about the distribution of responsibilities. An institution may show 40% parity while having very few women heading committees or in key positions.

⚠ This is a snapshot: the composition may change during a legislature (resignations, replacements, reshuffles).

**How to interpret**
The law has required strict parity for legislative elections since 2017 (as many female candidates as male candidates). Despite this, parity at the National Assembly remains below 50% due to election results. At the Senate, the mixed electoral system also produces gaps. For the Government, parity depends on the President's choices.

---

## Taux de participation aux votes

**What it measures**
The average participation rate of members of an institution (or political group) in public votes. Two variants are displayed:
- **All votes**: all public votes in plenary session.
- **Important votes**: only solemn public votes (final vote on an entire text) and motions of no confidence — the most politically important ones.

The Composition page also displays **individual records**: the deputy with the highest and lowest participation rate in the entire Assembly, for each of the two variants.

**How it is calculated**
For each public vote, LoiClair classifies each parliamentarian into one of these categories:
- **Voter**: the member expressed a vote (for, against, or abstention).
- **Non-participant**: the member did not vote even though they could have done so. This groups together those absent from the chamber (not recorded in the vote data) and "voluntary non-voters" (recorded but having chosen not to vote).

**Exclusion of institutional non-voters**: some deputies are recorded as "non-voters" in a vote not by choice, but due to their function:
- **PAN** (President of the National Assembly): does not vote to guarantee their impartiality.
- **PSE** (Session chairperson): chairs the debate and does not take part in the vote.
- **MG** (Government member): ministers do not vote at the Assembly.

These three cases are **excluded from the participation calculation**: the relevant vote is counted neither in the numerator nor in the denominator. This avoids penalising a deputy who is chairing a session or who is in the Government.

The rate takes into account the **actual term period**:

> Individual participation = Votes cast during the term ÷ Votes held during the term

This means:
- If a deputy arrives mid-legislature (by-election, replacement of a deputy appointed to the Government, etc.), only the votes since their **effective start of service** are counted — that is, the day they actually begin to sit, not the legal start date of the term (which may be several weeks earlier).
- If a deputy leaves their seat (to become a minister, for example) and then returns, their two term periods are added separately. The period spent in the Government — during which ministers do not vote at the Assembly — is excluded from both sides of the calculation (neither in votes nor in votes counted). Example: a deputy who sat from July 2024 to January 2025, then again since January 2026, sees their votes and votes from both windows added together — the period in the Government between the two does not enter the calculation.
- If a deputy permanently leaves their seat mid-legislature, only the votes of their service period are retained.

The average rate of a group is the average of these corrected individual rates:

> Group participation = Sum of individual rates ÷ Number of members with data

Numerical example: if 3 deputies have rates of 85%, 60% and 92%, the group's participation is (85 + 60 + 92) ÷ 3 = 79%.

In the detailed deputies table, the rate is accompanied by a detail "X / Y": X votes cast out of Y votes held during their term.

**Included** variables:
- **Votes cast**: for, against, abstention — all count as participation.
- **Voluntary non-voters and absent members**: added together as "non-participation".
- Only votes that took place during the deputy's actual term period are taken into account.
- **Vote corrections** ("mises au point") published by the NA are integrated: if a deputy reports a voting error (wrong button, technical malfunction), their corrected position is used.

**Excluded** variables and why:
- **Institutional non-voters** (President of the NA, session chairperson, Government member) are excluded from both sides of the calculation — the vote counts neither for nor against them.
- Members with **too few votes** to display a reliable rate: if fewer than 100 ordinary votes (or 10 important votes) have taken place since taking office, the rate is not displayed and a "not enough votes" badge is shown instead.
- The Government has no participation data (ministers do not vote in Parliament).
- Votes prior to the start of the term or after the end of the term are excluded.

**Where the data comes from**
The results of each public vote (who voted what, who was a non-voter, and for what reason) come from the National Assembly's open data. Any vote corrections ("mises au point") published after the vote are also integrated. Updated every night.

**What it does not measure**
⚠ Participation in a vote does not indicate whether the parliamentarian was physically present in the chamber. The vote may be delegated to a colleague (each deputy may carry one proxy — about 13% of votes are by delegation).

⚠ A low participation rate does not mean that the deputy does not work. Parliamentary work also includes committees, hearings, missions, and constituency work — none of these elements are measured here.

⚠ Important votes are less frequent than ordinary votes. A small number of important votes can make the rate more volatile.

**How to interpret**
An overall participation rate above 50% is average. Above 70%, participation is high. For important votes, rates are generally higher because these votes mobilise more (between 60% and 90% depending on the group).

---

## Participation moyenne aux scrutins

**What it measures**
How many deputies participate on average in a vote at the National Assembly? These indicators answer this question for two types of votes:
- **Ordinary votes**: day-to-day parliamentary votes (amendments, articles, procedures).
- **Important votes**: votes on an entire bill and motions of no confidence — the most politically important ones.

For each type, two figures are displayed: the average number of **voters** (those who expressed a vote) and the average number of **non-participants** (all those who did not vote, whatever the reason).

**How it is calculated**
For each vote, the number of voters and institutional non-voters is taken from the official results. An average is then derived across all votes of that type:

> Average voters = Total voters across all votes of that type ÷ Number of votes

> Eligible = 577 − Average institutional non-voters (PAN, PSE, MG)

> Average absent = Eligible − Average voters

577 corresponds to the total number of seats in the National Assembly. **Institutional non-voters** (President of the NA, session chairperson, Government members) are removed from the base because they cannot vote due to their function. Only deputies who could have voted are taken as the calculation base ("eligible").

"Absent" covers two distinct situations:
- **Voluntary non-voters** ("Personal position"): deputies recorded in the vote but having chosen not to vote — a very rare case in practice.
- **Not mentioned**: deputies absent from the chamber, who do not appear at all in the vote data.

The percentages displayed are calculated relative to the eligible base, not relative to the 577 seats.

Numerical example: for an ordinary vote with 160 voters and 3 institutional non-voters, the eligible are 577 − 3 = 574, and the absent are 574 − 160 = 414, i.e. 72% of eligible members.

**Included** variables:
- All public votes since the beginning of the current legislature.
- For important votes: final votes on an entire text and motions of no confidence.

**Excluded** variables:
- Votes for which the number of voters is not recorded in the source data.

**Where the data comes from**
The detailed results of each vote (number of voters, non-voters) come from the National Assembly's open data. Updated every night.

**What it does not measure**
⚠ The average smooths out variations between votes: a very mobilising vote may bring together 500 deputies, another only 80. The average does not reflect these extremes.

⚠ A "non-participant" is not necessarily absent from Paris: they may be present in the chamber but have chosen not to vote, or may have delegated their vote by proxy to a colleague.

**How to interpret**
Ordinary votes mobilise on average about 160 to 200 deputies out of 577 — about a third of the assembly. Important votes bring together more: generally between 350 and 450 deputies (60 to 80% of the assembly). An important vote with fewer than 300 participants would be unusually low.

---

## Taux de cohésion

**What it measures**
The degree of alignment of votes within a political group. A group whose members all systematically vote in the same direction has a cohesion of 100%. A group divided equally between for and against has a cohesion close to 50%.

Two levels are displayed on LoiClair:
- **Group cohesion** (political groups table): how often members of the group vote together.
- **Individual cohesion** (members table): how often a parliamentarian votes in the same direction as the majority position of their group.

The Composition page also displays **individual cohesion records**: the parliamentarian with the highest and lowest individual cohesion in the institution.

**How it is calculated**
The National Assembly publishes, for each vote, the majority position of each group (for, against, abstention). LoiClair uses this information to calculate cohesion.

**Group cohesion**: for each vote, LoiClair counts how many members of the group voted in the same direction as the majority position of the group, then divides by the total number of voters in the group.

> Cohesion for one vote = Number of members aligned with the majority position ÷ Number of voters in the group

> Internal group cohesion = Average cohesion across all votes

Numerical example: during a vote, if a group of 50 members has 45 "for" and 5 "against", and the majority position is "for", the cohesion for this vote is 90% (45 ÷ 50). The displayed cohesion is the average of this result across all votes of the legislature.

**Individual cohesion**: for each parliamentarian, LoiClair looks across all votes at how often this member voted in the same direction as the majority position of their group.

> Individual cohesion = Number of votes aligned with the group's position ÷ Total number of votes cast by the parliamentarian

Numerical example: if a deputy participated in 200 votes and voted with their group's position 170 times, their individual cohesion is 85%.

**Included** variables:
- **Majority position of the group**: published by the National Assembly for each vote (for, against, abstention).
- **Individual vote of each member**: compared to this majority position.

**Excluded** variables and why:
- Votes in which a member was absent are not counted in their individual cohesion calculation.
- The Government has no cohesion data (ministers do not vote in Parliament).

**Where the data comes from**
The majority positions of groups and individual votes come from the National Assembly's open data. LoiClair performs the cohesion calculation from this raw data. Updated every night.

**What it does not measure**
⚠ High cohesion does not mean the group agrees on substance. It may result from strict voting discipline (group voting instructions) rather than a convergence of opinions.

⚠ Cohesion does not distinguish between important votes and technical votes. A group may be very united on technical texts and divided on social issues, without the average reflecting this.

⚠ A parliamentarian with low individual cohesion is not necessarily a "dissident" — they may be a member with free vote on matters of conscience, or a member who frequently abstains when their group votes for or against.

**How to interpret**
Most political groups display cohesion above 80%, which is normal in the French parliamentary system where group discipline is strong. Below 70%, the group is experiencing significant divisions. Cohesion of 95% or above indicates a very disciplined group or a small group where divergences are rare.

For an individual parliamentarian, cohesion above 90% is very aligned with their group. Between 70% and 90%, there are occasional divergences. Below 70%, the member regularly votes differently from their group.

---

## Types de scrutins

**What it measures**
The National Assembly uses six modes of public vote, each with its own majority rules. LoiClair groups them into two categories for its participation indicators.

**The six types of votes**

| Code | Full name | Votes required for adoption | LoiClair category |
|------|-----------|----------------------------|-------------------|
| SPO | Ordinary public vote (Scrutin public ordinaire) | Simple majority: 50% + 1 of votes cast (abstentions do not count) | Ordinary |
| SPS | Solemn public vote (Scrutin public solennel) | Simple majority: 50% + 1 of votes cast | Important |
| MOC | Motion of no confidence (Motion de censure) | Absolute majority: 289 "for" votes out of 577, regardless of the number of voters | Important |
| SNOM | Nominative vote (Scrutin nominatif) | Simple majority: 50% + 1 of votes cast | Ordinary |
| SAT | Tribune vote (Scrutin à la tribune) | Simple majority: 50% + 1 of votes cast | Ordinary |
| SCG | Congress vote (Scrutin du Congrès) | Qualified majority: 3/5 of votes cast (used for constitutional revisions) | Ordinary |

**Impact on LoiClair indicators**
- The "all votes" indicators take into account all 6 types.
- The "important votes" indicators retain only **SPS** (final vote on an entire text) and **MOC** (motion of no confidence) — the most politically significant votes.

**What it does not measure**
⚠ Votes by show of hands and secret ballot votes exist in the Assembly's rules but are not provided by the electronic voting system. Only public votes (with individual recording of votes) are available.

---

## Classification thématique

**What it measures**
Each legislative dossier is classified into one or more themes (health, education, transport, etc.) to allow filtering of texts by subject on the "All texts" page. A single dossier may belong to several themes: for example, a text on transport pollution will be classified under both "Environment" and "Transport".

**How it is calculated**
The theme is assigned automatically from the **title** of the dossier, by detecting keywords characteristic of each subject.

For each theme, a list of typical terms has been defined. For example:
- **Transport**: transport, rail, motorway, aviation, SNCF, RATP, vehicle, mobility…
- **Education**: teaching, school, university, student, secondary school, apprenticeship…
- **Social issues and health**: health, hospital, illness, disability, vaccine, social security…

When the title of a dossier contains at least one of the terms associated with a theme, that theme is assigned to it. If the title contains terms from several themes, the dossier receives all corresponding themes.

The 27 available themes are:
Foreign affairs and cooperation, Agriculture and fishing, Veterans, Budget, Local authorities, Culture, Defence, Economy and finance (taxation), Education, Energy, Businesses, Environment, Family, Civil service, Justice, Housing and urban planning, Overseas territories, Police and security, Public powers and Constitution, Social issues and health, Research (science and technology), Social security, Sport, Treaties and conventions, Transport, Work, European Union.

Concrete example: the dossier "Government bill on accelerating the production of renewable energies" will be classified under the **Energy** theme thanks to the word "energies".

**Where the data comes from**
Dossier titles come from the National Assembly's open data. The keyword lists were built and validated manually by comparing them with the Senate's official themes on a sample of more than 8,000 dossiers.

**What it does not measure**
⚠ Some dossiers with very short or very administrative titles (for example "Extension of the state of emergency") may receive no theme. About 15% of dossiers remain without an assigned theme.

⚠ The classification is based solely on the title, not on the full content of the text. A dossier whose title does not explicitly mention the subject may be misclassified or unclassified.

⚠ Some themes partially overlap. For example, a text on "social security" may appear under both "Social security" and "Social issues and health". This is expected behaviour, not an error.

**How to interpret**
The theme filter is useful for exploring legislative activity by domain. It combines with the other filters (status, procedure type, political group, search): each filter independently restricts the list of results. For example, filtering by theme "Education" and status "Enacted" will display only education texts that have been enacted.

---

## Activité par groupe politique

**What it measures**
Two raw indicators covering the entire 17th legislature: how many legislative dossiers each group has tabled, and how many have resulted in an enacted law.

**How it is calculated**

*Texts proposed*
> Number of dossiers tabled = Total number of dossiers whose initiator belongs to the group

*Laws enacted*
> Number of enacted laws = Number of dossiers from this group whose final status is "enacted"

Example: if a group has initiated 150 dossiers and 12 have been enacted, it appears with 150 in the first chart and 12 in the second.

**Included** variables:
- All legislative dossiers with an identified initiator (parliamentary group or Government).
- Government dossiers are grouped into a single "Government" entry.
- Only groups that have initiated at least 10 dossiers are displayed.

**Excluded** variables:
- Dossiers without an identified initiator.
- Groups with fewer than 10 dossiers (too few to be significant).

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ The number of texts tabled does not reflect the quality of parliamentary work. An opposition group may table many texts without getting any adopted: this is a normal political strategy for participating in public debate.

⚠ The number of enacted laws is strongly correlated with membership of the majority. The Government naturally dominates this ranking, because its bills almost systematically benefit from majority support.

**How to interpret**
Compare the two charts together: a group that proposes a lot but gets little adopted is often in the opposition. A group that gets a large share of its texts adopted is in the majority or in government.

## Parlementaires les plus actifs

**What it measures**
The number of legislative texts in which each deputy or senator is involved, either as author or co-author, or as a designated rapporteur. The ranking covers parliamentarians currently in office (17th legislature for the National Assembly, current term for the Senate).

**How it is calculated**

> Total score = Number of texts where the parliamentarian is author + Number of texts where they are rapporteur

A parliamentarian may appear in both columns for the same text — they are then counted once as "Author" and once as "Rapporteur".

**Included** variables:
- All legislative texts recorded in LoiClair (private members' bills, government bills, amendments tabled, etc.).
- Only parliamentarians currently in office.

**Excluded** variables:
- Parliamentarians with no identified involvement in a text.
- Former parliamentarians who no longer sit.

**Where the data comes from**
Data comes from the National Assembly's open data, updated every night.

**What it does not measure**
⚠ This ranking measures the quantity of involvement, not the quality of work. A parliamentarian who tables many amendments or bills is not necessarily more effective than another.

⚠ The role of rapporteur is often assigned by standing committees according to political rules (distribution among groups). A parliamentarian in the majority or on a major committee will mechanically be rapporteur more often.

⚠ Texts without an identified author or rapporteur in the source data are not counted — some older texts or texts from the Senate may be under-represented.

**How to interpret**
A high score indicates a strong presence in the legislative process. Look separately at the "Author" and "Rapporteur" columns: a profile with many authoring credits is often a parliamentarian very active in tabling texts, while a profile with many rapporteur credits reflects strong involvement in committee work.
