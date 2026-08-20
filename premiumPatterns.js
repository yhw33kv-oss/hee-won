// premiumPatterns.js

const ACTIVITY = {
  SELF_INDEPENDENCE: 'SELF_INDEPENDENCE',
  OUTPUT_EXPRESSION: 'OUTPUT_EXPRESSION',
  RESOURCE_MANAGEMENT: 'RESOURCE_MANAGEMENT',
  STRUCTURE_RESPONSIBILITY: 'STRUCTURE_RESPONSIBILITY',
  LEARNING_PREPARATION: 'LEARNING_PREPARATION'
};

const STRATEGY_STATE = {
  PREPARE: 'PREPARE',
  EXECUTE: 'EXECUTE',
  EXPAND: 'EXPAND',
  CONSOLIDATE: 'CONSOLIDATE',
  TRANSITION: 'TRANSITION',
  REVIEW: 'REVIEW',
  MIXED: 'MIXED'
};

const RELATION = {
  SAME: 'SAME',
  SIX_HARMONY: 'SIX_HARMONY',
  CLASH: 'CLASH',
  NONE: 'NONE'
};

const RELATION_ROLES = {
  REQUIRED: 'REQUIRED',
  SUPPORTING: 'SUPPORTING',
  CONFLICTING: 'CONFLICTING',
  IRRELEVANT: 'IRRELEVANT'
};

const MATCH_LEVEL = {
  FULL_MATCH: 'FULL_MATCH',
  PARTIAL_MATCH: 'PARTIAL_MATCH',
  CONFLICTED_MATCH: 'CONFLICTED_MATCH',
  NO_MATCH: 'NO_MATCH'
};

const TIER = {
  TIER_A: 'TIER_A',
  TIER_B: 'TIER_B',
  TIER_C: 'TIER_C',
  TIER_D: 'TIER_D'
};

const COMPOSITE_PATTERNS = [
  {
    patternId: "OUTPUT_TO_RESOURCE",
    family: "COMPOSITE",
    requiredEvidence: {
      anyOf: [
        { DAEUN_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION, ANNUAL_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT },
        { DAEUN_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT, ANNUAL_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.SUPPORTING,
      CLASH: RELATION_ROLES.CONFLICTING
    },
    supportingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.SIX_HARMONY },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.SIX_HARMONY }
      ]
    },
    conflictingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
      ]
    },
    partialAllowed: true,
    partialEvidenceRules: [{ DAEUN_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION }, { ANNUAL_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT }],
    allowedStrategyStates: [STRATEGY_STATE.EXECUTE, STRATEGY_STATE.EXPAND],
    defaultStrategyState: STRATEGY_STATE.EXPAND,
    focusAreas: ["표현력의 구체화", "자원 확보 및 성과 관리"],
    domainTargets: ["CAREER_BUSINESS", "MONEY"],
    prohibitedClaims: ["큰 돈을 번다", "반드시 성공한다"]
  },
  {
    patternId: "RESOURCE_TO_RESPONSIBILITY",
    family: "COMPOSITE",
    requiredEvidence: {
      anyOf: [
        { DAEUN_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT, ANNUAL_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY },
        { DAEUN_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY, ANNUAL_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.SUPPORTING,
      CLASH: RELATION_ROLES.CONFLICTING
    },
    supportingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.SIX_HARMONY },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.SIX_HARMONY }
      ]
    },
    conflictingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
      ]
    },
    partialAllowed: true,
    partialEvidenceRules: [{ DAEUN_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT }, { ANNUAL_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY }],
    allowedStrategyStates: [STRATEGY_STATE.EXPAND, STRATEGY_STATE.CONSOLIDATE],
    defaultStrategyState: STRATEGY_STATE.CONSOLIDATE,
    focusAreas: ["관리 범위 확대", "역할과 조직적 책임 증가"],
    domainTargets: ["CAREER_BUSINESS", "MONEY"],
    prohibitedClaims: ["임원 승진 확정", "완벽한 합격"]
  },
  {
    patternId: "LEARNING_TO_OUTPUT",
    family: "COMPOSITE",
    requiredEvidence: {
      anyOf: [
        { DAEUN_ACTIVITY: ACTIVITY.LEARNING_PREPARATION, ANNUAL_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION },
        { DAEUN_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION, ANNUAL_ACTIVITY: ACTIVITY.LEARNING_PREPARATION }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.SUPPORTING,
      CLASH: RELATION_ROLES.CONFLICTING
    },
    supportingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.SIX_HARMONY },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.SIX_HARMONY }
      ]
    },
    conflictingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
      ]
    },
    partialAllowed: true,
    partialEvidenceRules: [{ DAEUN_ACTIVITY: ACTIVITY.LEARNING_PREPARATION }, { ANNUAL_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION }],
    allowedStrategyStates: [STRATEGY_STATE.PREPARE, STRATEGY_STATE.EXECUTE],
    defaultStrategyState: STRATEGY_STATE.EXECUTE,
    focusAreas: ["준비한 것을 실행으로 전환", "아이디어 구현"],
    domainTargets: ["CAREER_BUSINESS", "RELATIONSHIP"],
    prohibitedClaims: ["시험 무조건 합격", "자격증 확정"]
  },
  {
    patternId: "OUTPUT_PLUS_CHANGE",
    family: "COMPOSITE",
    requiredEvidence: {
      allOf: [
        {
          anyOf: [
            { DAEUN_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION },
            { ANNUAL_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION }
          ]
        },
        {
          anyOf: [
            { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
            { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
          ]
        }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.IRRELEVANT,
      CLASH: RELATION_ROLES.REQUIRED
    },
    supportingEvidence: { anyOf: [] },
    conflictingEvidence: { anyOf: [] },
    partialAllowed: true,
    partialEvidenceRules: [{ ANNUAL_ACTIVITY: ACTIVITY.OUTPUT_EXPRESSION }, { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }],
    allowedStrategyStates: [STRATEGY_STATE.EXECUTE, STRATEGY_STATE.TRANSITION],
    defaultStrategyState: STRATEGY_STATE.TRANSITION,
    focusAreas: ["환경 변화에 대응하는 활동력", "새로운 방식 시도"],
    domainTargets: ["CAREER_BUSINESS", "RELATIONSHIP"],
    prohibitedClaims: ["독립 확정", "파괴적 실패"]
  },
  {
    patternId: "RESOURCE_PLUS_COOPERATION",
    family: "COMPOSITE",
    requiredEvidence: {
      allOf: [
        {
          anyOf: [
            { DAEUN_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT },
            { ANNUAL_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT }
          ]
        },
        {
          anyOf: [
            { DAY_BRANCH_DAEUN_RELATION: RELATION.SIX_HARMONY },
            { DAY_BRANCH_ANNUAL_RELATION: RELATION.SIX_HARMONY }
          ]
        }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.REQUIRED,
      CLASH: RELATION_ROLES.CONFLICTING
    },
    supportingEvidence: { anyOf: [] },
    conflictingEvidence: {
      anyOf: [
        { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
        { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
      ]
    },
    partialAllowed: true,
    partialEvidenceRules: [{ ANNUAL_ACTIVITY: ACTIVITY.RESOURCE_MANAGEMENT }, { DAY_BRANCH_ANNUAL_RELATION: RELATION.SIX_HARMONY }],
    allowedStrategyStates: [STRATEGY_STATE.EXPAND, STRATEGY_STATE.CONSOLIDATE],
    defaultStrategyState: STRATEGY_STATE.CONSOLIDATE,
    focusAreas: ["파트너십 조율", "결합을 통한 자원 확보"],
    domainTargets: ["MONEY", "RELATIONSHIP"],
    prohibitedClaims: ["투자 대박", "결혼 확정"]
  },
  {
    patternId: "RESPONSIBILITY_PLUS_CHANGE",
    family: "COMPOSITE",
    requiredEvidence: {
      allOf: [
        {
          anyOf: [
            { DAEUN_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY },
            { ANNUAL_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY }
          ]
        },
        {
          anyOf: [
            { DAY_BRANCH_DAEUN_RELATION: RELATION.CLASH },
            { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }
          ]
        }
      ]
    },
    relationRoles: {
      SIX_HARMONY: RELATION_ROLES.IRRELEVANT,
      CLASH: RELATION_ROLES.REQUIRED
    },
    supportingEvidence: { anyOf: [] },
    conflictingEvidence: { anyOf: [] },
    partialAllowed: true,
    partialEvidenceRules: [{ ANNUAL_ACTIVITY: ACTIVITY.STRUCTURE_RESPONSIBILITY }, { DAY_BRANCH_ANNUAL_RELATION: RELATION.CLASH }],
    allowedStrategyStates: [STRATEGY_STATE.CONSOLIDATE, STRATEGY_STATE.TRANSITION],
    defaultStrategyState: STRATEGY_STATE.TRANSITION,
    focusAreas: ["조직 환경 변화 대응", "책임 조정 속 결단"],
    domainTargets: ["CAREER_BUSINESS", "RELATIONSHIP"],
    prohibitedClaims: ["해고", "파산"]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ACTIVITY, STRATEGY_STATE, RELATION, RELATION_ROLES, MATCH_LEVEL, TIER, COMPOSITE_PATTERNS };
}
