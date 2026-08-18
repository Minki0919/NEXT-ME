export type LoginResponse = {
  userId: number;
  accessToken: string;
  username: string;
  name: string;
  email: string;
};

export type UserProfile = {
  userId: number;
  profileEmpty: boolean;
  profileCompleted: boolean;
  onboardingStatus: "INCOMPLETE" | "COMPLETE";
  onboardingMode: "GUIDED" | "DIRECT" | null;
  onboardingStep: number | null;
  nickname: string | null;
  gender: string | null;
  ageGroup: number | null;
  workDay: string | null;
  leaveTime: string | null;
  comeTime: string | null;
  workStyle: string | null;
  sleepHour: number | null;
  makeupFrequency: string | null;
  sunscreenFrequency: string | null;
  exerciseCount: number | null;
  sweatAmount: string | null;
  skinType: string | null;
  concerns: string | null;
  personalColor: string | null;
  skinTypeConfidence: number | null;
  personalColorConfidence: number | null;
};

export type OnboardingQuestion = {
  field: string;
  question: string;
  type: "input" | "number" | "select" | "multi-select";
  required: boolean;
  options: string[] | null;
};

export type OnboardingAnswerResponse = {
  completed: boolean;
  detectedSkinType: string | null;
  detectedPersonalColor: string | null;
  nextQuestions: OnboardingQuestion[] | null;
  profile: UserProfile | null;
  photoRetryRequired: boolean | null;
  photoRetryMessage: string | null;
  analysisMessage: string | null;
  skinTypeConfidence: number | null;
  personalColorConfidence: number | null;
};

export type DetailAnalysisResponse = {
  completed: boolean;
  detectedSkinType?: string | null;
  detectedPersonalColor?: string | null;
  nextQuestions?: OnboardingQuestion[] | null;
  profile?: UserProfile | null;
  photoRetryRequired: boolean;
  photoRetryMessage?: string | null;
  analysisMessage?: string | null;
  skinTypeConfidence?: number | null;
  personalColorConfidence?: number | null;
};

export type PhotoRetryResponse = {
  completed: boolean;
  detectedSkinType?: string | null;
  detectedPersonalColor?: string | null;
  nextQuestions?: OnboardingQuestion[] | null;
  profile?: UserProfile | null;
  photoRetryRequired: boolean;
  photoRetryMessage?: string | null;
  analysisMessage?: string | null;
  skinTypeConfidence?: number | null;
  personalColorConfidence?: number | null;
};

export type RoutinePreferences = {
  userId?: number;
  routineCleansing: boolean;
  routineSkinCare: boolean;
  routinePersonalColor: boolean;
  routineSleepWake: boolean;
  routineDiet: boolean;
  routineExercise: boolean;
};

export type AiChatRequest = {
  conversationId: number | null;
  message: string;
};

export type AiChatResponse = {
  conversationId: number;
  answer: string;
  outOfScope: boolean;
  createdAt: string;
};

export type AiConversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type AiChatMessage = {
  id: number;
  role: "USER" | "ASSISTANT";
  content: string;
  outOfScope: boolean;
  createdAt: string;
};

export type RoutineCategory =
  | "CLEANSING"
  | "SKIN_CARE"
  | "SLEEP_WAKE"
  | "DIET"
  | "EXERCISE";

export type RoutineItem = {
  id: number;
  category: RoutineCategory;
  title: string;
  description: string;
  scheduledTime: string;
  completionWindowMinutes: number;
  availableAt: string;
  deadlineAt: string;
  sortOrder: number;
  completed: boolean;
  completedAt: string | null;
  expired: boolean;
  editable: boolean;
};

export type CharacterReward = {
  rewardProcessed: boolean;
  alreadyProcessed: boolean;
  newCharacterCollected: boolean;
  characterNumber: number | null;
  ownedCount: number;
  totalCharacterCount: number;
  allCharactersCollected: boolean;
  message: string;
};

export type CharacterCollection = {
  totalCharacterCount: number;
  ownedCount: number;
  allCharactersCollected: boolean;
  ownedCharacterNumbers: number[];
};

export type CharacterCatalogItem = {
  characterNumber: number;
  owned: boolean;
  collectedAt: string | null;
};

export type CharacterCatalog = {
  totalCharacterCount: number;
  ownedCount: number;
  allCharactersCollected: boolean;
  characters: CharacterCatalogItem[];
};

export type CareArea = "CLEANSING" | "SKIN_CARE";

export type CareIngredient = {
  careArea: CareArea;
  productType: string;
  ingredient: string;
  reason: string;
  guidance: string;
};

export type UserCareRecommendation = {
  recommendationId: number;
  skinType: string;
  concerns: string;
  summary: string;
  recommendedIngredients: CareIngredient[];
  cautionIngredients: CareIngredient[];
  disclaimer: string;
  createdAt: string;
};

export type RoutinePlan = {
  routineGenerated: boolean;
  planId: number | null;
  routineDate: string;
  resetTime: string;
  completionPercentage: number;
  allCompleted: boolean;
  firstCompletedAt: string | null;
  characterReward: CharacterReward | null;
  coachMessage: string | null;
  items: RoutineItem[];
};

export type RoutineProgress = {
  routineGenerated: boolean;
  planId: number | null;
  routineDate: string;
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
  allCompleted: boolean;
};

export type RoutineSettings = {
  resetTime: string;
  zoneId: string;
};

export type RoutineCompletionStats = {
  totalCompletedCount: number;
  completions: RoutineCompletion[];
};

export type RoutineCompletion = {
  completedDate: string;
  completedAt: string;
  completionNumber: number;
};

export type Outfit = {
  style: string;
  top: string;
  bottom: string;
  outerwear: string;
  shoes: string;
  accessories: string;
  colorPalette: string[];
  reason: string;
};

export type OutfitRecommendation = {
  recommendationId: number;
  recommendationDate: string;
  personalColor: string;
  summary: string;
  outfits: Outfit[];
  createdAt: string;
};

export type CosmeticRecommendation = {
  category: string;
  productType: string;
  recommendedColors: string[];
  finish: string;
  reason: string;
};

export type MakeupRecommendation = {
  recommendationId: number;
  recommendationDate: string;
  personalColor: string;
  summary: string;
  cosmetics: CosmeticRecommendation[];
  createdAt: string;
};

export type PersonalColorChatResponse = {
  conversationId: number;
  reply: string;
  completed: boolean;
  personalColor: string | null;
  confidence: number | null;
};

export type PersonalColorConversation = {
  conversationId: number;
  status: "ACTIVE" | "COMPLETED";
  personalColor: string | null;
  confidence: number | null;
  updatedAt: string;
};

export type PersonalColorMessage = {
  messageId: number;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};
