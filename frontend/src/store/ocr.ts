import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Document, OCRResult, Annotation } from '../types'

export const useOcrStore = defineStore('ocr', () => {
  const documents = ref<Document[]>([])
  const currentDoc = ref<Document | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const searchResults = ref<OCRResult[]>([])

  // Mock data
  const MOCK_DOCS: Document[] = [
    {
      id: '1',
      name: '论语·学而篇',
      imageUrl: '',
      mockCanvas: {
        columns: [
          { chars: ['子', '曰', '學', '而', '時', '習', '之', '不', '亦', '説', '乎'] },
          { chars: ['有', '朋', '自', '遠', '方', '來', '不', '亦', '樂', '乎'] },
          { chars: ['人', '不', '知', '而', '不', '慍', '不', '亦', '君', '子', '乎'] },
        ],
      },
      results: [
        { id: 'r1', text: '子曰', bbox: [50, 30, 80, 40], confidence: 0.95 },
        { id: 'r2', text: '學而時習之', bbox: [50, 80, 200, 40], confidence: 0.88 },
        { id: 'r3', text: '不亦説乎', bbox: [50, 130, 160, 40], confidence: 0.91 },
        { id: 'r4', text: '有朋自遠方來', bbox: [200, 30, 240, 40], confidence: 0.87 },
        { id: 'r5', text: '不亦樂乎', bbox: [200, 80, 160, 40], confidence: 0.93 },
        { id: 'r6', text: '人不知而不慍', bbox: [200, 130, 260, 40], confidence: 0.86 },
        { id: 'r7', text: '不亦君子乎', bbox: [200, 180, 200, 40], confidence: 0.90 },
      ],
      annotations: [],
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      name: '道德經·第一章',
      imageUrl: '',
      mockCanvas: {
        columns: [
          { chars: ['道', '可', '道', '非', '常', '道'] },
          { chars: ['名', '可', '名', '非', '常', '名'] },
          { chars: ['無', '名', '天', '地', '之', '始'] },
          { chars: ['有', '名', '萬', '物', '之', '母'] },
        ],
      },
      results: [
        { id: 'r1', text: '道可道', bbox: [50, 30, 120, 40], confidence: 0.96 },
        { id: 'r2', text: '非常道', bbox: [50, 80, 120, 40], confidence: 0.92 },
        { id: 'r3', text: '名可名', bbox: [200, 30, 120, 40], confidence: 0.94 },
        { id: 'r4', text: '非常名', bbox: [200, 80, 120, 40], confidence: 0.91 },
        { id: 'r5', text: '無名天地之始', bbox: [350, 30, 280, 40], confidence: 0.89 },
        { id: 'r6', text: '有名萬物之母', bbox: [350, 80, 280, 40], confidence: 0.87 },
      ],
      annotations: [],
      createdAt: '2025-02-10',
    },
    {
      id: '3',
      name: '詩經·關雎',
      imageUrl: '',
      mockCanvas: {
        columns: [
          { chars: ['關', '關', '雎', '鳩', '在', '河', '之', '洲'] },
          { chars: ['窈', '窕', '淑', '女', '君', '子', '好', '逑'] },
          { chars: ['參', '差', '荇', '菜', '左', '右', '流', '之'] },
        ],
      },
      results: [
        { id: 'r1', text: '關關雎鳩', bbox: [50, 30, 180, 40], confidence: 0.94 },
        { id: 'r2', text: '在河之洲', bbox: [50, 80, 180, 40], confidence: 0.91 },
        { id: 'r3', text: '窈窕淑女', bbox: [200, 30, 180, 40], confidence: 0.90 },
        { id: 'r4', text: '君子好逑', bbox: [200, 80, 180, 40], confidence: 0.93 },
        { id: 'r5', text: '參差荇菜', bbox: [350, 30, 180, 40], confidence: 0.85 },
        { id: 'r6', text: '左右流之', bbox: [350, 80, 180, 40], confidence: 0.88 },
      ],
      annotations: [],
      createdAt: '2025-03-05',
    },
  ]

  const VARIANT_DICT: Record<string, string> = {
    '説': '说', '學': '学', '習': '习', '遠': '远', '樂': '乐', '書': '书',
    '國': '国', '東': '东', '長': '长', '門': '门', '馬': '马', '鳥': '鸟',
    '風': '风', '雲': '云', '龍': '龙', '車': '车', '萬': '万', '見': '见',
  }

  function loadMockDocuments() {
    documents.value = MOCK_DOCS.map(d => ({ ...d, annotations: [], results: d.results.map(r => ({ ...r })) }))
    currentDoc.value = documents.value[0]
  }

  async function uploadAndOCR(file: File) {
    isLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (resp.ok) {
        const data = await resp.json()
        const doc: Document = {
          id: Date.now().toString(),
          name: file.name,
          imageUrl: URL.createObjectURL(file),
          results: data.results || [],
          annotations: [],
          createdAt: new Date().toISOString()
        }
        documents.value.push(doc)
        currentDoc.value = doc
      }
    } catch {
      // Use mock data as fallback
      loadMockDocuments()
    } finally {
      isLoading.value = false
    }
  }

  function addAnnotation(type: Annotation['type'], bbox: [number, number, number, number], label: string, content: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations.push({
      id: Date.now().toString(),
      type, bbox, label, content
    })
  }

  function removeAnnotation(id: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations = currentDoc.value.annotations.filter(a => a.id !== id)
  }

  function convertVariant(text: string): string {
    return text.split('').map(c => VARIANT_DICT[c] || c).join('')
  }

  function searchInDocuments(query: string) {
    const q = query.toLowerCase()
    searchResults.value = documents.value.flatMap(d =>
      d.results.filter(r => r.text.includes(q) || (r.corrected || '').includes(q))
    )
  }

  function exportTEI(): string {
    if (!currentDoc.value) return ''
    let tei = '<?xml version="1.0" encoding="UTF-8"?>\n'
    tei += '<TEI xmlns="http://www.tei-c.org/ns/1.0">\n'
    tei += `  <teiHeader><fileDesc><titleStmt><title>${currentDoc.value.name}</title></titleStmt></fileDesc></teiHeader>\n`
    tei += '  <text><body>\n'
    for (const r of currentDoc.value.results) {
      tei += `    <seg type="line" xml:id="${r.id}" cert="${r.confidence}">${r.corrected || r.text}</seg>\n`
    }
    tei += '  </body></text>\n</TEI>'
    return tei
  }

  return {
    documents, currentDoc, isLoading, searchQuery, searchResults,
    loadMockDocuments, uploadAndOCR, addAnnotation, removeAnnotation,
    convertVariant, searchInDocuments, exportTEI
  }
})
