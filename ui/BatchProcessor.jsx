/**
 * NSFWTagger Stash Plugin - Batch Processor Component
 * 
 * Handles batch processing of scenes and images with progress tracking and error handling.
 */

class BatchProcessor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mode: props.initialMode || 'untagged',
      type: props.initialType || 'scenes',
      days: props.initialDays || 7,
      limit: props.initialLimit || 100,
      selectedItems: [],
      allSelected: false,
      processing: false,
      progress: {
        current: 0,
        total: 0,
        completed: 0,
        failed: 0,
        status: 'idle'
      },
      results: [],
      errors: [],
      items: [],
      loading: false,
      error: null
    };

    this.stashClient = null;
    this.nsfwClient = null;
    this.processingInterval = null;
  }

  async componentDidMount() {
    await this.initializeClients();
    await this.loadItems();
  }

  componentWillUnmount() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  async initializeClients() {
    try {
      const stashEndpoint = this.props.settings.stash_endpoint || 'http://localhost:9999';
      this.stashClient = new StashClient(stashEndpoint);

      const nsfwHost = this.props.settings.nsfwtagger_host || 'localhost';
      const nsfwPort = this.props.settings.nsfwtagger_port || 8000;
      const nsfwTimeout = this.props.settings.timeout || 300;
      this.nsfwClient = new NSFWTaggerClient(nsfwHost, nsfwPort, nsfwTimeout);
    } catch (error) {
      this.setState({ error: 'Failed to initialize clients: ' + error.message });
    }
  }

  async loadItems() {
    this.setState({ loading: true, error: null });

    try {
      let items = [];
      let count = 0;

      if (this.state.mode === 'untagged') {
        if (this.state.type === 'scenes') {
          const result = await this.stashClient.getUntaggedScenes(this.state.limit, 1);
          items = result.scenes;
          count = result.count;
        } else {
          const result = await this.stashClient.getUntaggedImages(this.state.limit, 1);
          items = result.images;
          count = result.count;
        }
      } else if (this.state.mode === 'recent') {
        if (this.state.type === 'scenes') {
          const result = await this.stashClient.getRecentScenes(this.state.days, this.state.limit, 1);
          items = result.scenes;
          count = result.count;
        } else {
          const result = await this.stashClient.getRecentImages(this.state.days, this.state.limit, 1);
          items = result.images;
          count = result.count;
        }
      } else if (this.state.mode === 'all') {
        if (this.state.type === 'scenes') {
          const result = await this.stashClient.getAllScenes(this.state.limit, 1);
          items = result.scenes;
          count = result.count;
        } else {
          const result = await this.stashClient.getAllImages(this.state.limit, 1);
          items = result.images;
          count = result.count;
        }
      }

      this.setState({
        items,
        loading: false,
        progress: {
          ...this.state.progress,
          total: items.length
        }
      });

    } catch (error) {
      this.setState({
        loading: false,
        error: 'Failed to load items: ' + error.message
      });
    }
  }

  handleModeChange = (mode) => {
    this.setState({ mode, selectedItems: [], allSelected: false }, () => {
      this.loadItems();
    });
  };

  handleTypeChange = (type) => {
    this.setState({ type, selectedItems: [], allSelected: false }, () => {
      this.loadItems();
    });
  };

  handleDaysChange = (days) => {
    this.setState({ days }, () => {
      if (this.state.mode === 'recent') {
        this.loadItems();
      }
    });
  };

  handleLimitChange = (limit) => {
    this.setState({ limit }, () => {
      this.loadItems();
    });
  };

  handleSelectItem = (itemId) => {
    const { selectedItems } = this.state;
    const newSelected = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];

    this.setState({
      selectedItems: newSelected,
      allSelected: newSelected.length === this.state.items.length
    });
  };

  handleSelectAll = () => {
    const { allSelected, items } = this.state;
    const newSelected = allSelected ? [] : items.map(item => item.id);
    
    this.setState({
      selectedItems: newSelected,
      allSelected: !allSelected
    });
  };

  async startProcessing() {
    const { selectedItems, type } = this.state;

    if (selectedItems.length === 0) {
      alert('Please select at least one item to process');
      return;
    }

    // Validate connection
    const validation = await this.nsfwClient.validateConnection();
    if (!validation.valid) {
      alert('Connection validation failed: ' + validation.error);
      return;
    }

    this.setState({
      processing: true,
      progress: {
        current: 0,
        total: selectedItems.length,
        completed: 0,
        failed: 0,
        status: 'processing'
      },
      results: [],
      errors: []
    });

    // Start progress tracking
    this.startProgressTracking();

    // Process items
    await this.processItems(selectedItems, type);

    // Stop progress tracking
    this.stopProgressTracking();

    this.setState({ processing: false });
  }

  startProgressTracking() {
    this.processingInterval = setInterval(() => {
      this.setState(prevState => ({
        progress: {
          ...prevState.progress,
          current: prevState.progress.current + 1
        }
      }));
    }, 1000);
  }

  stopProgressTracking() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  async processItems(itemIds, type) {
    const { concurrency = 4 } = this.props.settings;
    const batches = this.createBatches(itemIds, concurrency);

    for (const batch of batches) {
      const promises = batch.map(itemId => 
        this.processItem(itemId, type).catch(error => ({
          id: itemId,
          success: false,
          error: error.message
        }))
      );

      const results = await Promise.all(promises);
      
      this.setState(prevState => {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        return {
          results: [...prevState.results, ...successful],
          errors: [...prevState.errors, ...failed],
          progress: {
            ...prevState.progress,
            completed: prevState.progress.completed + successful.length,
            failed: prevState.progress.failed + failed.length
          }
        };
      });
    }
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async processItem(itemId, type) {
    try {
      let result;

      if (type === 'scenes') {
        result = await this.nsfwClient.processSceneWithRetry(itemId, {
          frame_interval: this.props.settings.frame_interval || 5,
          max_frames: this.props.settings.max_frames || 50,
          shot_detection: this.props.settings.shot_detection !== false
        });
      } else {
        result = await this.nsfwClient.processImageWithRetry(itemId, {
          quality: this.props.settings.quality || 'high'
        });
      }

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      // Apply results to Stash
      await this.applyResultsToStash(itemId, type, result.result);

      return {
        id: itemId,
        success: true,
        result: result.result
      };

    } catch (error) {
      throw error;
    }
  }

  async applyResultsToStash(itemId, type, result) {
    try {
      // Create tags
      const tagIds = [];
      if (result.tags && result.tags.length > 0) {
        for (const tagName of result.tags) {
          const tagId = await this.stashClient.createTagIfNotExists(tagName);
          if (tagId) {
            tagIds.push(tagId);
          }
        }

        // Add tags to item
        if (tagIds.length > 0) {
          if (type === 'scenes') {
            await this.stashClient.addTagsToScene(itemId, tagIds);
          } else {
            await this.stashClient.addTagsToImage(itemId, tagIds);
          }
        }
      }

      // Create markers (for scenes only)
      if (type === 'scenes' && result.markers && result.markers.length > 0) {
        for (const marker of result.markers) {
          await this.stashClient.createSceneMarker(
            itemId,
            marker.title,
            marker.seconds,
            marker.tags || []
          );
        }
      }

    } catch (error) {
      console.error(`Failed to apply results for ${type} ${itemId}:`, error);
      throw error;
    }
  }

  async cancelProcessing() {
    try {
      await this.nsfwClient.cancelProcessing();
      this.setState({
        processing: false,
        progress: {
          current: 0,
          total: 0,
          completed: 0,
          failed: 0,
          status: 'cancelled'
        }
      });
      this.stopProgressTracking();
    } catch (error) {
      console.error('Failed to cancel processing:', error);
      alert('Failed to cancel processing: ' + error.message);
    }
  }

  getProgressPercentage() {
    const { progress } = this.state;
    if (progress.total === 0) return 0;
    return Math.round((progress.completed / progress.total) * 100);
  }

  renderModeSelector() {
    return (
      <div className="mode-selector">
        <h3>Processing Mode</h3>
        <div className="mode-buttons">
          <button 
            className={`mode-button ${this.state.mode === 'untagged' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('untagged')}
          >
            Untagged Only
          </button>
          <button 
            className={`mode-button ${this.state.mode === 'recent' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('recent')}
          >
            Recent Items
          </button>
          <button 
            className={`mode-button ${this.state.mode === 'all' ? 'active' : ''}`}
            onClick={() => this.handleModeChange('all')}
          >
            All Items
          </button>
        </div>
      </div>
    );
  }

  renderTypeSelector() {
    return (
      <div className="type-selector">
        <h3>Item Type</h3>
        <div className="type-buttons">
          <button 
            className={`type-button ${this.state.type === 'scenes' ? 'active' : ''}`}
            onClick={() => this.handleTypeChange('scenes')}
          >
            Scenes
          </button>
          <button 
            className={`type-button ${this.state.type === 'images' ? 'active' : ''}`}
            onClick={() => this.handleTypeChange('images')}
          >
            Images
          </button>
        </div>
      </div>
    );
  }

  renderFilters() {
    return (
      <div className="filters">
        {this.state.mode === 'recent' && (
          <div className="filter-item">
            <label>Days:</label>
            <input
              type="number"
              min="1"
              max="365"
              value={this.state.days}
              onChange={(e) => this.handleDaysChange(parseInt(e.target.value))}
            />
          </div>
        )}
        <div className="filter-item">
          <label>Limit:</label>
          <input
            type="number"
            min="1"
            max="1000"
            value={this.state.limit}
            onChange={(e) => this.handleLimitChange(parseInt(e.target.value))}
          />
        </div>
        <button className="refresh-button" onClick={() => this.loadItems()}>
          Refresh
        </button>
      </div>
    );
  }

  renderItemList() {
    const { items, selectedItems, loading } = this.state;

    if (loading) {
      return <div className="loading">Loading items...</div>;
    }

    return (
      <div className="item-list">
        <div className="item-list-header">
          <input
            type="checkbox"
            checked={this.state.allSelected}
            onChange={this.handleSelectAll}
          />
          <span>Select All</span>
          <span className="item-count">{selectedItems.length} selected</span>
        </div>
        <div className="item-list-items">
          {items.map(item => (
            <div key={item.id} className="item-row">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => this.handleSelectItem(item.id)}
              />
              <div className="item-info">
                <div className="item-title">{item.title || item.name || `Item ${item.id}`}</div>
                <div className="item-details">
                  {item.date && <span>Date: {item.date}</span>}
                  {item.rating && <span>Rating: {item.rating}</span>}
                  {item.performers && item.performers.length > 0 && (
                    <span>Performers: {item.performers.map(p => p.name).join(', ')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderProgress() {
    const { processing, progress } = this.state;
    
    if (!processing) return null;

    const percentage = this.getProgressPercentage();

    return (
      <div className="progress-section">
        <h3>Processing Progress</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="progress-info">
          <span>{percentage}% Complete</span>
          <span>{progress.completed}/{progress.total} Completed</span>
          <span>{progress.failed} Failed</span>
        </div>
        <button className="cancel-button" onClick={() => this.cancelProcessing()}>
          Cancel
        </button>
      </div>
    );
  }

  renderResults() {
    const { results, errors } = this.state;

    if (results.length === 0 && errors.length === 0) return null;

    return (
      <div className="results-section">
        <h3>Results</h3>
        {results.length > 0 && (
          <div className="success-results">
            <h4>Successful ({results.length})</h4>
            {results.map((result, index) => (
              <div key={index} className="result-item success">
                <span className="result-id">{result.id}</span>
                <span className="result-status">✓ Success</span>
                <div className="result-tags">
                  {result.result.tags && result.result.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.length > 0 && (
          <div className="error-results">
            <h4>Failed ({errors.length})</h4>
            {errors.map((error, index) => (
              <div key={index} className="result-item error">
                <span className="result-id">{error.id}</span>
                <span className="result-status">✗ Failed</span>
                <span className="result-error">{error.error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  render() {
    const { processing, error } = this.state;

    return (
      <div className="batch-processor">
        <div className="batch-header">
          <h1>Batch Processor</h1>
          <div className="batch-subtitle">Process multiple scenes or images with AI tagging</div>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <div className="batch-controls">
          {this.renderModeSelector()}
          {this.renderTypeSelector()}
          {this.renderFilters()}
        </div>

        <div className="batch-content">
          {this.renderItemList()}
          
          <div className="batch-actions">
            <button 
              className="start-button"
              onClick={() => this.startProcessing()}
              disabled={processing || this.state.selectedItems.length === 0}
            >
              {processing ? 'Processing...' : 'Start Processing'}
            </button>
            
            <div className="selection-info">
              {this.state.selectedItems.length} items selected
            </div>
          </div>

          {this.renderProgress()}
          {this.renderResults()}
        </div>
      </div>
    );
  }
}

// CSS styles
const styles = `
  .batch-processor {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .batch-header {
    margin-bottom: 20px;
  }

  .batch-header h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #374151;
  }

  .batch-subtitle {
    color: #6b7280;
    font-size: 14px;
  }

  .error-banner {
    background: #fee2e2;
    color: #991b1b;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  .batch-controls {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .mode-selector, .type-selector {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
  }

  .mode-selector h3, .type-selector h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    color: #374151;
  }

  .mode-buttons, .type-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mode-button, .type-button {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .mode-button:hover, .type-button:hover {
    border-color: #9ca3af;
  }

  .mode-button.active, .type-button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .filters {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
  }

  .filter-item input {
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    width: 100px;
  }

  .refresh-button {
    padding: 8px 16px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .refresh-button:hover {
    background: #059669;
  }

  .batch-content {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
  }

  .item-list {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
  }

  .item-list-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f3f4f6;
    margin-bottom: 12px;
  }

  .item-list-header input {
    width: auto;
  }

  .item-count {
    margin-left: auto;
    font-size: 12px;
    color: #6b7280;
  }

  .item-list-items {
    max-height: 400px;
    overflow-y: auto;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .item-row:last-child {
    border-bottom: none;
  }

  .item-info {
    flex: 1;
  }

  .item-title {
    font-weight: 500;
    color: #111827;
    margin-bottom: 4px;
  }

  .item-details {
    font-size: 12px;
    color: #6b7280;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .batch-actions {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 20px;
  }

  .start-button {
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background-color 0.2s;
  }

  .start-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .start-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .selection-info {
    font-size: 14px;
    color: #6b7280;
  }

  .progress-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .progress-section h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #374151;
  }

  .progress-bar {
    width: 100%;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #374151;
    margin-bottom: 12px;
  }

  .cancel-button {
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .cancel-button:hover {
    background: #dc2626;
  }

  .results-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-top: 16px;
  }

  .results-section h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #374151;
  }

  .success-results, .error-results {
    margin-bottom: 16px;
  }

  .success-results h4, .error-results h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #374151;
  }

  .result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 6px;
    border: 1px solid #f3f4f6;
  }

  .result-item.success {
    background: #ecfdf5;
    border-color: #bbf7d0;
  }

  .result-item.error {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .result-id {
    font-family: monospace;
    font-size: 12px;
    color: #374151;
    min-width: 120px;
  }

  .result-status {
    font-size: 12px;
    font-weight: bold;
    min-width: 80px;
  }

  .result-status.success {
    color: #065f46;
  }

  .result-status.error {
    color: #991b1b;
  }

  .result-error {
    color: #991b1b;
    font-size: 13px;
  }

  .result-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-left: auto;
  }

  .tag {
    background: #e5e7eb;
    color: #374151;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  .loading {
    text-align: center;
    padding: 20px;
    color: #6b7280;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default BatchProcessor;
