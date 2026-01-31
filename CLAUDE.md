# SG Deal Tracker - Claude Instructions

## About Social Glass
Social Glass is a platform that helps brands get insights from real live Gen Z consumers so they can tailor their content and campaigns for actual business impact and growth.

**Value Proposition**: Real-time Gen Z consumer insights for marketing optimization and campaign effectiveness.

## Prospect Search Guidelines

### Target Personas (in order of priority)
1. **CMO / Chief Marketing Officer** - Decision maker for marketing spend
2. **VP/SVP Consumer Insights** - Owns research budgets, cares about consumer understanding
3. **VP/SVP Brand Marketing** - Responsible for brand strategy and consumer connection
4. **Head of Gen Z Strategy** - Specifically focused on younger demographics
5. **VP Digital Marketing** - Often owns social and digital consumer engagement
6. **Creative Directors** - The creative lead at an agency responsible for brand
7. **Head of Insights** - Either a brand or agency role responspible for cultural insights

### Target Company Criteria
- **Size**: Enterprise (Fortune 1000) and growth-stage brands with $25M+ revenue
- **B2C Focus**: Must sell directly to consumers (not B2B)
- **Marketing Spend**: Companies with significant marketing/advertising budgets

### Priority Industries
1. Beauty & Cosmetics
2. Apparel & Fashion
3. Quick Service Restaurant (QSR)
4. Food & Beverage
5. Consumer Packaged Goods (CPG)
6. Entertainment & Media
7. Alcohol & Spirits
8. Retail
9. Gaming
10. Automotive (luxury/youth-focused brands)

### Company Tiers
**Tier 1 - Priority Targets** (pursue aggressively):
- Companies actively marketing to Gen Z
- Brands with recent "brand refresh" or "youth strategy" announcements
- Companies that have publicly discussed Gen Z challenges

**Tier 2 - Strong Fit**:
- Established brands needing to stay relevant
- Companies launching new products for younger demographics

**Tier 3 - Opportunistic**:
- Traditional brands exploring youth markets
- Companies with aging customer bases

### Information to Capture
For each prospect, try to find:
- [ ] Full name and exact title
- [ ] Company and industry
- [ ] Recent news/announcements about their marketing initiatives
- [ ] Any public statements about Gen Z or youth marketing
- [ ] LinkedIn profile URL (if publicly available)
- [ ] Email pattern for the company (if discoverable)
- (Don't include a prospect without having a name)

### Companies to EXCLUDE
- B2B-only companies
- Companies with controversial reputations
- Direct competitors to existing clients (check current prospects first)

### Notes Format
When adding AI-generated prospects, include in the notes:
- Their role/responsibility
- Why they're a good fit for Social Glass
- Any relevant recent news or initiatives
- Source of the information

### Search Strategy
When researching prospects:
1. Look for recent CMO/marketing leadership appointments (within 12 months)
2. Search for "[Industry] + CMO + Gen Z strategy"
3. Check industry publications (Ad Age, Marketing Dive, WWD, etc.)
4. Look for conference speakers at marketing/insights events
5. Review company earnings calls for mentions of youth/Gen Z initiatives

## Development Guidelines

### Database
- Supabase project: SG Deal Tracker
- Always use the correct startup_id for Social Glass: `a0000000-0000-0000-0000-000000000001`

### When Adding Prospects via SQL
- Always set `source: 'ai_generated'` for AI-researched prospects
- Use appropriate `function` values: marketing, insights, partnerships, other
- Start all new prospects at stage `new`
