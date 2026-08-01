import { type UIStrings } from './i18n'
import { type BadgeKey } from './types'

export const BADGE_CONFIG: Record<BadgeKey, {
  bg: string
  text: string
  darkBg: string
  darkText: string
}> = {
  'queer-friendly': { bg: '#ededf5', text: '#4a4a72', darkBg: '#2a2a3a', darkText: '#b0b0d0' },
  'reproductive-autonomy': { bg: '#f0ebe5', text: '#6a5a42', darkBg: '#2e2a24', darkText: '#c0aa88' },
  'trauma-informed': { bg: '#f0e8e8', text: '#724a4a', darkBg: '#302424', darkText: '#c09090' },
  'accessible': { bg: '#e5ecf0', text: '#3a5a6a', darkBg: '#1e2830', darkText: '#88b0c8' },
  'financially-considerate': { bg: '#e6f0e6', text: '#3a6a3a', darkBg: '#1e2e1e', darkText: '#88c088' },
  'confidential-autonomous': { bg: '#ebebeb', text: '#4a4a4a', darkBg: '#2a2a2a', darkText: '#b0b0b0' },
  'sex-positive': { bg: '#e8e8f0', text: '#4a4a6a', darkBg: '#28283a', darkText: '#a8a8c8' },
  'non-traditional-family': { bg: '#ecebe5', text: '#5a5a42', darkBg: '#2a2a22', darkText: '#b0b098' },
}

export const BADGE_LABEL_KEYS: Record<BadgeKey, keyof UIStrings> = {
  'queer-friendly': 'badgeQueerFriendly',
  'reproductive-autonomy': 'badgeReproAutonomy',
  'trauma-informed': 'badgeTraumaInformed',
  'accessible': 'badgeAccessible',
  'financially-considerate': 'badgeAffordable',
  'confidential-autonomous': 'badgeConfidentialAutonomous',
  'sex-positive': 'badgeSexPositive',
  'non-traditional-family': 'badgeNonTradFamily',
}

export const INCLUSIVITY_GROUP_LABEL_KEYS: Record<BadgeKey, keyof UIStrings> = {
  'queer-friendly': 'groupLgbtq',
  'reproductive-autonomy': 'groupRepro',
  'trauma-informed': 'groupTrauma',
  'accessible': 'groupAccessibility',
  'financially-considerate': 'groupFinancial',
  'confidential-autonomous': 'groupConfidentiality',
  'sex-positive': 'groupSexual',
  'non-traditional-family': 'groupFamily',
}

export const INCLUSIVITY_QUESTION_LABEL_KEYS: Record<string, keyof UIStrings> = {
  'welcomes-trans': 'criterionWelcomesTrans',
  'discusses-gender-dysphoria': 'criterionDiscussesGenderDysphoria',
  'queer-sexuality': 'criterionQueerSexuality',
  'kink-polyamory': 'criterionKinkPolyamory',
  'no-marriage-as-cure': 'criterionNoMarriageAsCure',
  'accepts-sexual-history': 'criterionAcceptsSexualHistory',
  'celibate-childfree': 'criterionCelibateChildfree',
  'birth-control-options': 'criterionBirthControlOptions',
  'morning-after-pill': 'criterionMorningAfterPill',
  'respects-abortion-choice': 'criterionRespectsAbortionChoice',
  'surgical-abortions': 'criterionSurgicalAbortions',
  'pill-abortions': 'criterionPillAbortions',
  'respects-fertility-choices': 'criterionRespectsFertilityChoices',
  'infertility-treatment': 'criterionInfertilityTreatment',
  'welcomes-survivors': 'criterionWelcomesSurvivors',
  'supports-minors': 'criterionSupportsMinors',
  'respects-boundaries': 'criterionRespectsBoundaries',
  'accepts-criticism': 'criterionAcceptsCriticism',
  'welcomes-std': 'criterionWelcomesStd',
  'mental-illness-sexuality': 'criterionMentalIllnessSexuality',
  'examines-professionally': 'criterionExaminesProfessionally',
  'answers-without-judgment': 'criterionAnswersWithoutJudgment',
  'refers-competently': 'criterionRefersCompetently',
  'discusses-sex-work': 'criterionDiscussesSexWork',
  'advocates-sexual-satisfaction': 'criterionAdvocatesSexualSatisfaction',
  'discusses-masturbation': 'criterionDiscussesMasturbation',
  'menstrual-hygiene-choices': 'criterionMenstrualHygieneChoices',
  'respects-hymen-views': 'criterionRespectsHymenViews',
  'wheelchair-accessible': 'criterionWheelchairAccessible',
  'other-disability': 'criterionOtherDisability',
  'disability-sexuality': 'criterionDisabilitySexuality',
  'welcomes-poor-illiterate': 'criterionWelcomesPoorIlliterate',
  'no-unnecessary-tests': 'criterionNoUnnecessaryTests',
  'welcomes-oppressed-groups': 'criterionWelcomesOppressedGroups',
  'respects-dietary-choices': 'criterionRespectsDietaryChoices',
  'alternative-therapies': 'criterionAlternativeTherapies',
  'keeps-info-private': 'criterionKeepsInfoPrivate',
  'treats-as-autonomous': 'criterionTreatsAsAutonomous',
  'advocates-legal-rights': 'criterionAdvocatesLegalRights',
  'respects-companions': 'criterionRespectsCompanions',
  'supports-single-parenting': 'criterionSupportsSingleParenting',
  'non-traditional-birthing': 'criterionNonTraditionalBirthing',
  'welcomes-companions-delivery': 'criterionWelcomesCompanionsDelivery',
  'respects-surgical-decisions': 'criterionRespectsSurgicalDecisions',
  'refuses-sex-reveal': 'criterionRefusesSexReveal',
  'up-to-date-knowledge': 'criterionUpToDateKnowledge',
  'screens-for-cancers': 'criterionScreensForCancers',
}
