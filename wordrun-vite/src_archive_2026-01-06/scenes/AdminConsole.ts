import Phaser from 'phaser'
import { DataManager } from '../DataManager'
import { supabase } from '../supabase'
import type { Asset, ArtPack, Level, Season, FeatureFlag, MapNode, MapEdge } from '../supabase'

/**
 * AdminConsole - In-game admin interface for managing game data
 * Provides CSV import/export, visual editing, and live configuration
 */
export class AdminConsole extends Phaser.Scene {
  private dataManager!: DataManager
  private currentTab = 'flags'
  private previewDate?: string
  
  constructor() {
    super({ key: 'AdminConsole' })
  }

  init() {
    this.dataManager = DataManager.getInstance()
  }

  create() {
    this.createAdminUI()
  }

  private createAdminUI() {
    const adminHTML = `
      <div id="admin-console" class="fixed inset-0 bg-black/80 z-50 overflow-auto">
        <div class="min-h-screen p-4">
          <div class="max-w-6xl mx-auto bg-white rounded-lg shadow-xl">
            <!-- Header -->
            <div class="bg-gray-900 text-white p-4 rounded-t-lg flex justify-between items-center">
              <h1 class="text-2xl font-bold">Admin Console</h1>
              <button id="admin-close" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white">
                Close
              </button>
            </div>

            <!-- Tab Navigation -->
            <div class="bg-gray-100 border-b">
              <nav class="flex space-x-8 px-4">
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="flags">
                  Feature Flags
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="seasons">
                  Seasons
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="assets">
                  Art & Assets
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="levels">
                  Levels
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="map">
                  World Map
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="import">
                  Import/Export
                </button>
                <button class="tab-btn py-3 px-2 border-b-2 border-transparent hover:border-blue-500 data-[active=true]:border-blue-500 data-[active=true]:text-blue-600" data-tab="checks">
                  Health Checks
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-6">
              <!-- Feature Flags Tab -->
              <div id="tab-flags" class="tab-content">
                <h2 class="text-xl font-semibold mb-4">Feature Flags</h2>
                <div class="space-y-4">
                  <div id="flags-list" class="space-y-2"></div>
                  <button id="add-flag" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Add New Flag
                  </button>
                </div>
              </div>

              <!-- Seasons Tab -->
              <div id="tab-seasons" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">Seasonal Themes</h2>
                <div class="mb-4 p-4 bg-blue-50 rounded">
                  <label class="block text-sm font-medium mb-2">Preview Date (for testing):</label>
                  <input id="preview-date" type="date" class="border rounded px-3 py-2">
                  <button id="apply-preview" class="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Apply Preview
                  </button>
                </div>
                <div id="seasons-list" class="space-y-2"></div>
                <button id="add-season" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Add New Season
                </button>
              </div>

              <!-- Assets Tab -->
              <div id="tab-assets" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">Art Packs & Assets</h2>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 class="font-medium mb-2">Art Packs</h3>
                    <div id="artpacks-list" class="space-y-2"></div>
                  </div>
                  <div>
                    <h3 class="font-medium mb-2">Assets</h3>
                    <div id="assets-list" class="space-y-2 max-h-96 overflow-y-auto"></div>
                  </div>
                </div>
              </div>

              <!-- Levels Tab -->
              <div id="tab-levels" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">Level Configuration</h2>
                <div id="levels-list" class="space-y-2 max-h-96 overflow-y-auto"></div>
              </div>

              <!-- Map Tab -->
              <div id="tab-map" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">World Map Editor</h2>
                <div class="bg-gray-100 p-4 rounded mb-4">
                  <p class="text-sm text-gray-600">Click and drag nodes to reposition them. Lines show connections between levels.</p>
                </div>
                <div id="map-editor" class="bg-blue-50 rounded relative w-full h-96 border-2 border-dashed border-blue-300">
                  <div class="absolute inset-0 flex items-center justify-center text-gray-500">
                    Map Editor - Click to add nodes
                  </div>
                </div>
              </div>

              <!-- Import/Export Tab -->
              <div id="tab-import" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">Import/Export Data</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 class="font-medium mb-2">Import CSV</h3>
                    <select id="import-table" class="block w-full border rounded px-3 py-2 mb-2">
                      <option value="levels">Levels</option>
                      <option value="map_nodes">Map Nodes</option>
                      <option value="map_edges">Map Edges</option>
                      <option value="art_packs">Art Packs</option>
                      <option value="assets">Assets</option>
                      <option value="seasons">Seasons</option>
                      <option value="feature_flags">Feature Flags</option>
                      <option value="localization">Localization</option>
                    </select>
                    <input id="csv-file" type="file" accept=".csv" class="block w-full border rounded px-3 py-2 mb-2">
                    <button id="import-csv" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full">
                      Import CSV
                    </button>
                  </div>
                  <div>
                    <h3 class="font-medium mb-2">Export CSV</h3>
                    <select id="export-table" class="block w-full border rounded px-3 py-2 mb-2">
                      <option value="levels">Levels</option>
                      <option value="map_nodes">Map Nodes</option>
                      <option value="map_edges">Map Edges</option>
                      <option value="art_packs">Art Packs</option>
                      <option value="assets">Assets</option>
                      <option value="seasons">Seasons</option>
                      <option value="feature_flags">Feature Flags</option>
                      <option value="localization">Localization</option>
                    </select>
                    <button id="export-csv" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full">
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>

              <!-- Health Checks Tab -->
              <div id="tab-checks" class="tab-content hidden">
                <h2 class="text-xl font-semibold mb-4">System Health Checks</h2>
                <button id="run-checks" class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mb-4">
                  Run All Checks
                </button>
                <div id="checks-results" class="space-y-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // Add the admin UI to the DOM
    const adminContainer = this.add.dom(0, 0).createFromHTML(adminHTML)
    adminContainer.setOrigin(0, 0)

    this.setupEventListeners()
    this.switchTab('flags')
  }

  private setupEventListeners() {
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn')
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        const tab = target.dataset.tab
        if (tab) this.switchTab(tab)
      })
    })

    // Close button
    document.getElementById('admin-close')?.addEventListener('click', () => {
      this.scene.stop()
    })

    // Feature flags
    document.getElementById('add-flag')?.addEventListener('click', () => {
      this.addNewFlag()
    })

    // Seasons
    document.getElementById('apply-preview')?.addEventListener('click', () => {
      this.applyPreviewDate()
    })

    document.getElementById('add-season')?.addEventListener('click', () => {
      this.addNewSeason()
    })

    // Health checks
    document.getElementById('run-checks')?.addEventListener('click', () => {
      this.runHealthChecks()
    })

    // CSV Import/Export
    document.getElementById('import-csv')?.addEventListener('click', () => {
      this.importCSV()
    })

    document.getElementById('export-csv')?.addEventListener('click', () => {
      this.exportCSV()
    })
  }

  private switchTab(tabName: string) {
    this.currentTab = tabName

    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn')
    tabButtons.forEach(btn => {
      const isActive = btn.getAttribute('data-tab') === tabName
      btn.setAttribute('data-active', isActive.toString())
    })

    // Show/hide tab content
    const tabContents = document.querySelectorAll('.tab-content')
    tabContents.forEach(content => {
      content.classList.add('hidden')
    })
    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden')

    // Load tab data
    this.loadTabData(tabName)
  }

  private async loadTabData(tabName: string) {
    switch (tabName) {
      case 'flags':
        await this.loadFeatureFlags()
        break
      case 'seasons':
        await this.loadSeasons()
        break
      case 'assets':
        await this.loadAssets()
        break
      case 'levels':
        await this.loadLevels()
        break
      case 'map':
        await this.loadMapEditor()
        break
    }
  }

  private async loadFeatureFlags() {
    const { data: flags } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_key')

    const listEl = document.getElementById('flags-list')!
    listEl.innerHTML = ''

    flags?.forEach(flag => {
      const flagEl = document.createElement('div')
      flagEl.className = 'flex items-center justify-between p-3 bg-gray-50 rounded'
      flagEl.innerHTML = `
        <div class="flex-1">
          <div class="font-medium">${flag.flag_key}</div>
          <div class="text-sm text-gray-600">${flag.notes || ''}</div>
          <div class="text-xs text-gray-500">Rule: ${flag.target_rule}</div>
        </div>
        <label class="flex items-center">
          <input type="checkbox" ${flag.default_value ? 'checked' : ''} 
                 class="mr-2" data-flag="${flag.flag_key}">
          Default Enabled
        </label>
      `
      listEl.appendChild(flagEl)

      // Add change listener
      const checkbox = flagEl.querySelector('input[type="checkbox"]') as HTMLInputElement
      checkbox.addEventListener('change', () => {
        this.updateFeatureFlag(flag.flag_key, checkbox.checked)
      })
    })
  }

  private async updateFeatureFlag(flagKey: string, defaultValue: boolean) {
    const { error } = await supabase
      .from('feature_flags')
      .update({ default_value: defaultValue })
      .eq('flag_key', flagKey)

    if (error) {
      console.error('Failed to update feature flag:', error)
      alert('Failed to update feature flag')
    }
  }

  private async addNewFlag() {
    const flagKey = prompt('Enter flag key (e.g., enable_new_feature):')
    if (!flagKey) return

    const { error } = await supabase
      .from('feature_flags')
      .insert({
        flag_key: flagKey,
        default_value: false,
        target_rule: 'pct:0',
        notes: 'New feature flag'
      })

    if (error) {
      console.error('Failed to add feature flag:', error)
      alert('Failed to add feature flag')
    } else {
      this.loadFeatureFlags()
    }
  }

  private async loadSeasons() {
    const { data: seasons } = await supabase
      .from('seasons')
      .select('*')
      .order('start_date', { ascending: false })

    const listEl = document.getElementById('seasons-list')!
    listEl.innerHTML = ''

    seasons?.forEach(season => {
      const seasonEl = document.createElement('div')
      seasonEl.className = 'p-3 bg-gray-50 rounded'
      seasonEl.innerHTML = `
        <div class="font-medium">${season.season_id}</div>
        <div class="text-sm text-gray-600">Art Pack: ${season.art_pack_key}</div>
        <div class="text-sm text-gray-600">Dates: ${season.start_date} to ${season.end_date}</div>
        <div class="text-sm text-gray-600">Priority: ${season.priority}</div>
      `
      listEl.appendChild(seasonEl)
    })
  }

  private async applyPreviewDate() {
    const dateInput = document.getElementById('preview-date') as HTMLInputElement
    if (!dateInput.value) return

    this.previewDate = dateInput.value
    // TODO: Implement preview logic that temporarily overrides current date for testing
    alert(`Preview date set to ${this.previewDate}. This would simulate the game running on that date.`)
  }

  private async addNewSeason() {
    const seasonId = prompt('Enter season ID (e.g., spring2024):')
    if (!seasonId) return

    const artPackKey = prompt('Enter art pack key:', 'winter')
    if (!artPackKey) return

    const startDate = prompt('Enter start date (YYYY-MM-DD):', '2024-12-01')
    if (!startDate) return

    const endDate = prompt('Enter end date (YYYY-MM-DD):', '2025-02-28')
    if (!endDate) return

    const { error } = await supabase
      .from('seasons')
      .insert({
        season_id: seasonId,
        art_pack_key: artPackKey,
        start_date: startDate,
        end_date: endDate,
        priority: 1
      })

    if (error) {
      console.error('Failed to add season:', error)
      alert('Failed to add season')
    } else {
      this.loadSeasons()
    }
  }

  private async loadAssets() {
    const { data: artPacks } = await supabase.from('art_packs').select('*').order('art_pack_key')
    const { data: assets } = await supabase.from('assets').select('*').order('asset_key')

    // Load art packs
    const artPacksList = document.getElementById('artpacks-list')!
    artPacksList.innerHTML = ''
    artPacks?.forEach(pack => {
      const packEl = document.createElement('div')
      packEl.className = 'p-2 bg-gray-100 rounded text-sm'
      packEl.innerHTML = `<strong>${pack.art_pack_key}</strong>: ${pack.display_name}`
      artPacksList.appendChild(packEl)
    })

    // Load assets
    const assetsList = document.getElementById('assets-list')!
    assetsList.innerHTML = ''
    assets?.forEach(asset => {
      const assetEl = document.createElement('div')
      assetEl.className = 'p-2 bg-gray-100 rounded text-sm'
      assetEl.innerHTML = `
        <div><strong>${asset.asset_key}</strong> (${asset.type})</div>
        <div class="text-xs text-gray-600 truncate">${asset.uri}</div>
      `
      assetsList.appendChild(assetEl)
    })
  }

  private async loadLevels() {
    const { data: levels } = await supabase
      .from('levels')
      .select('*')
      .order('level_id')

    const listEl = document.getElementById('levels-list')!
    listEl.innerHTML = ''

    levels?.forEach(level => {
      const levelEl = document.createElement('div')
      levelEl.className = 'p-3 bg-gray-50 rounded'
      levelEl.innerHTML = `
        <div class="font-medium">${level.level_id} - Chapter ${level.chapter}</div>
        <div class="text-sm text-gray-600">Difficulty: ${level.difficulty} | Target: ${level.target_score} pts</div>
        <div class="text-sm text-gray-600">Time Limit: ${level.time_limit_seconds || 'None'} | Art: ${level.art_pack_key}</div>
      `
      listEl.appendChild(levelEl)
    })
  }

  private async loadMapEditor() {
    const { data: nodes } = await supabase.from('map_nodes').select('*').eq('world_id', 'world1')
    const { data: edges } = await supabase.from('map_edges').select('*').eq('world_id', 'world1')

    const editorEl = document.getElementById('map-editor')!
    editorEl.innerHTML = ''

    // Draw nodes
    nodes?.forEach(node => {
      const nodeEl = document.createElement('div')
      nodeEl.className = 'absolute w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow cursor-pointer'
      nodeEl.style.left = `${node.x_pct}%`
      nodeEl.style.top = `${node.y_pct}%`
      nodeEl.style.transform = 'translate(-50%, -50%)'
      nodeEl.title = node.display_name
      nodeEl.dataset.nodeId = node.map_node_id

      // Make draggable
      let isDragging = false
      nodeEl.addEventListener('mousedown', (e) => {
        isDragging = true
        e.preventDefault()
      })

      document.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        const rect = editorEl.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        nodeEl.style.left = `${Math.max(0, Math.min(100, x))}%`
        nodeEl.style.top = `${Math.max(0, Math.min(100, y))}%`
      })

      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false
          const x = parseInt(nodeEl.style.left.replace('%', ''))
          const y = parseInt(nodeEl.style.top.replace('%', ''))
          this.updateNodePosition(node.map_node_id, x, y)
        }
      })

      editorEl.appendChild(nodeEl)
    })

    // TODO: Draw edges/connections between nodes
  }

  private async updateNodePosition(nodeId: string, xPct: number, yPct: number) {
    const { error } = await supabase
      .from('map_nodes')
      .update({ x_pct: xPct, y_pct: yPct })
      .eq('map_node_id', nodeId)

    if (error) {
      console.error('Failed to update node position:', error)
    }
  }

  private async runHealthChecks() {
    const resultsEl = document.getElementById('checks-results')!
    resultsEl.innerHTML = '<div class="text-gray-600">Running checks...</div>'

    const results: string[] = []

    try {
      // Check 1: All levels.art_pack_key exist in art_packs
      const { data: levels } = await supabase.from('levels').select('art_pack_key')
      const { data: artPacks } = await supabase.from('art_packs').select('art_pack_key')
      
      const artPackKeys = new Set(artPacks?.map(p => p.art_pack_key))
      const invalidArtPacks = levels?.filter(l => !artPackKeys.has(l.art_pack_key))
      
      if (invalidArtPacks?.length) {
        results.push(`❌ Found ${invalidArtPacks.length} levels with invalid art pack references`)
      } else {
        results.push('✅ All level art pack references are valid')
      }

      // Check 2: All referenced asset keys exist
      const { data: assets } = await supabase.from('assets').select('asset_key')
      const assetKeys = new Set(assets?.map((a: any) => a.asset_key))
      
      const referencedAssets = new Set<string>()
      artPacks?.forEach((pack: any) => {
        referencedAssets.add(pack.avatar_key)
        referencedAssets.add(pack.tile_set_key)
        referencedAssets.add(pack.bg_world_key)
      })
      
      const missingAssets = Array.from(referencedAssets).filter(key => !assetKeys.has(key))
      if (missingAssets.length) {
        results.push(`❌ Missing ${missingAssets.length} referenced assets: ${missingAssets.join(', ')}`)
      } else {
        results.push('✅ All referenced assets exist')
      }

      // Check 3: No circular next_level_id chains
      const levelMap = new Map()
      levels?.forEach((level: any) => {
        levelMap.set(level.level_id, level.next_level_id_on_win)
      })
      
      let hasCircular = false
      for (const [levelId] of levelMap) {
        const visited = new Set()
        let current = levelId
        while (current && levelMap.has(current)) {
          if (visited.has(current)) {
            hasCircular = true
            break
          }
          visited.add(current)
          current = levelMap.get(current)
        }
        if (hasCircular) break
      }
      
      if (hasCircular) {
        results.push('❌ Found circular level progression chains')
      } else {
        results.push('✅ No circular level chains detected')
      }

      // Check 4: Season date ranges don't overlap
      const { data: seasons } = await supabase.from('seasons').select('*').order('priority')
      let hasOverlap = false
      for (let i = 0; i < (seasons?.length || 0) - 1; i++) {
        for (let j = i + 1; j < (seasons?.length || 0); j++) {
          const season1 = seasons![i]
          const season2 = seasons![j]
          
          if (season1.priority === season2.priority) {
            const start1 = new Date(season1.start_date)
            const end1 = new Date(season1.end_date)
            const start2 = new Date(season2.start_date)
            const end2 = new Date(season2.end_date)
            
            if ((start1 <= end2) && (start2 <= end1)) {
              hasOverlap = true
              break
            }
          }
        }
        if (hasOverlap) break
      }
      
      if (hasOverlap) {
        results.push('❌ Found overlapping season date ranges with same priority')
      } else {
        results.push('✅ No overlapping seasons detected')
      }

      // Check 5: Map transition data integrity
      const { LevelManager } = await import('../LevelManager')
      const testLevels = ['L001', 'L002'] // Test with first two levels
      
      for (const levelId of testLevels) {
        try {
          const testResult = await LevelManager.testMapTransitionData(levelId)
          if (testResult.hasCurrentNode && testResult.hasNextNode && testResult.hasEdge) {
            results.push(`✅ Map transition data complete for ${levelId}`)
          } else {
            results.push(`⚠️ Map transition data incomplete for ${levelId}: ${testResult.message}`)
          }
        } catch (error) {
          results.push(`❌ Failed to test map transition for ${levelId}: ${error.message}`)
        }
      }

    } catch (error) {
      results.push(`❌ Error running checks: ${error}`)
    }

    resultsEl.innerHTML = results.map(result => 
      `<div class="p-2 rounded ${result.startsWith('✅') ? 'bg-green-50' : 'bg-red-50'}">${result}</div>`
    ).join('')
  }

  private async importCSV() {
    const tableSelect = document.getElementById('import-table') as HTMLSelectElement
    const fileInput = document.getElementById('csv-file') as HTMLInputElement
    
    if (!fileInput.files?.length) {
      alert('Please select a CSV file')
      return
    }

    const file = fileInput.files[0]
    const text = await file.text()
    
    try {
      const rows = this.parseCSV(text)
      if (rows.length === 0) {
        alert('CSV file is empty')
        return
      }

      const { error } = await supabase
        .from(tableSelect.value)
        .upsert(rows)

      if (error) throw error

      alert(`Successfully imported ${rows.length} rows to ${tableSelect.value}`)
      this.loadTabData(this.currentTab) // Refresh current tab
    } catch (error) {
      console.error('Import failed:', error)
      alert(`Import failed: ${error}`)
    }
  }

  private async exportCSV() {
    const tableSelect = document.getElementById('export-table') as HTMLSelectElement
    const tableName = tableSelect.value

    try {
      const { data, error } = await supabase.from(tableName).select('*')
      if (error) throw error

      if (!data || data.length === 0) {
        alert('No data to export')
        return
      }

      const csv = this.convertToCSV(data)
      this.downloadCSV(csv, `${tableName}.csv`)
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error}`)
    }
  }

  private parseCSV(text: string): any[] {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const rows: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row: any = {}
      
      headers.forEach((header, index) => {
        const value = values[index] || ''
        // Try to parse as number or boolean
        if (value === 'true') row[header] = true
        else if (value === 'false') row[header] = false
        else if (!isNaN(Number(value)) && value !== '') row[header] = Number(value)
        else row[header] = value
      })
      
      rows.push(row)
    }

    return rows
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        return String(value).replace(/,/g, ';') // Replace commas to avoid CSV issues
      })
      csvRows.push(values.join(','))
    })

    return csvRows.join('\n')
  }

  private downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }
}