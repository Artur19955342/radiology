export type LocalizationDictionaryEntry = {
  id: string
  label: string
}

export type LocalizationDictionary = {
  id: string
  title: string
  entries: LocalizationDictionaryEntry[]
}

export const localizationDictionaries: LocalizationDictionary[] = [
  {
    id: 'brain',
    title: 'Головной мозг',
    entries: [
      { id: 'frontal-lobe', label: 'лобная доля' },
      { id: 'parietal-lobe', label: 'теменная доля' },
      { id: 'temporal-lobe', label: 'височная доля' },
      { id: 'occipital-lobe', label: 'затылочная доля' },
      { id: 'insula', label: 'островковая доля' },
      { id: 'basal-ganglia', label: 'базальные ядра' },
      { id: 'thalamus', label: 'таламус' },
      { id: 'internal-capsule', label: 'внутренняя капсула' },
      { id: 'corpus-callosum', label: 'мозолистое тело' },
      { id: 'centrum-semiovale', label: 'семиовальный центр' },
      { id: 'corona-radiata', label: 'лучистый венец' },
      { id: 'hippocampus', label: 'гиппокамп' },
      { id: 'amygdala', label: 'миндалина' },
      { id: 'cerebellum', label: 'мозжечок' },
      { id: 'brainstem', label: 'ствол мозга' },
      { id: 'midbrain', label: 'средний мозг' },
      { id: 'pons', label: 'мост' },
      { id: 'medulla', label: 'продолговатый мозг' },
      { id: 'lateral-ventricle', label: 'боковой желудочек' },
      { id: 'third-ventricle', label: 'третий желудочек' },
      { id: 'fourth-ventricle', label: 'четвертый желудочек' },
      { id: 'precentral-gyrus', label: 'прецентральная извилина' },
      { id: 'postcentral-gyrus', label: 'постцентральная извилина' },
      { id: 'sylvian-fissure', label: 'сильвиева щель' },
    ],
  },
]

export const defaultLocalizationDictionary = localizationDictionaries[0]
