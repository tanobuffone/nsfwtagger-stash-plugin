/**
 * NSFWTagger Stash Plugin - Dashboard Component
 * 
 * Main dashboard component showing plugin status, quick actions, and processing overview.
 */

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: {
        plugin: 'unknown',
        container: 'unknown',
        lmstudio: 'unknown',
        stash: 'unknown'
      },
      metrics: {
        totalScenes: 0,
        totalImages: 0,
        processedScenes: 0,
        processedImages: 0,
        pendingScenes: 0,
        pendingImages: 0
      },
      recentActivity: [],
      loading: true,
      error: null
    };

    this.stashClient = null;
    this.nsfwClient = null;
  }

  async componentDidMount() {
    await this.initializeClients();
    await this.loadStatus();
    await this.loadMetrics();
    await this.loadRecentActivity();
    
    // Poll for updates every 30 seconds
    this.pollingInterval = setInterval(async () => {
      await this.loadStatus();
      await this.loadMetrics();
    }, 30000);
  }

  componentWillUnmount() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  async initializeClients() {
    try {
      // Initialize Stash client
      const stashEndpoint = this.props.settings.stash_endpoint || 'http://localhost:9999';
      this.stashClient = new StashClient(stashEndpoint);

      // Initialize NSFWTagger client
      const nsfwHost = this.props.settings.nsfwtagger_host || 'localhost';
      const nsfwPort = this.props.settings.nsfwtagger_port || 8000;
      const nsfwTimeout = this.props.settings.timeout || 300;
      this.nsfwClient = new NSFWTaggerClient(nsfwHost, nsfwPort, nsfwTimeout);

      this.setState({ loading: false });
    } catch (error) {
      this.setState({
        loading: false,
        error: 'Failed to initialize clients: ' + error.message
      });
    }
  }

  async loadStatus() {
    const status = { ...this.state.status };

    try {
      // Check Stash connection
      const stashHealth = await this.stashClient.healthCheck();
      status.stash = stashHealth.connected ? 'healthy' : 'error';

      // Check NSFWTagger container
      const containerHealth = await this.nsfwClient.healthCheck();
      status.container = containerHealth.healthy ? 'healthy' : 'error';

      // Check LMStudio connection
      const lmstudioTest = await this.nsfwClient.testLMStudioConnection();
      status.lmstudio = lmstudioTest.connected ? 'healthy' : 'error';

      // Check plugin status
      status.plugin = 'ready';

    } catch (error) {
      console.error('Status check failed:', error);
      status.plugin = 'error';
    }

    this.setState({ status });
  }

  async loadMetrics() {
    try {
      const [scenesResult, imagesResult] = await Promise.all([
        this.stashClient.getAllScenes(1, 1),
        this.stashClient.getAllImages(1, 1)
      ]);

      const [untaggedScenes, untaggedImages] = await Promise.all([
        this.stashClient.getUntaggedScenes(100, 1),
        this.stashClient.getUntaggedImages(100, 1)
      ]);

      const metrics = {
        totalScenes: scenesResult.count,
        totalImages: imagesResult.count,
        pendingScenes: untaggedScenes.count,
        pendingImages: untaggedImages.count,
        processedScenes: scenesResult.count - untaggedScenes.count,
        processedImages: imagesResult.count - untaggedImages.count
      };

      this.setState({ metrics });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const logs = await this.nsfwClient.getLogs('INFO', 10);
      this.setState({ recentActivity: logs.logs || [] });
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  getStatusColor(status) {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#9ca3af';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'error': return 'Error';
      case 'warning': return 'Warning';
      default: return 'Unknown';
    }
  }

  async handleQuickAction(action) {
    try {
      switch (action) {
        case 'process_untagged_scenes':
          this.props.onNavigate('/batch', { mode: 'untagged', type: 'scenes' });
          break;
        case 'process_untagged_images':
          this.props.onNavigate('/batch', { mode: 'untagged', type: 'images' });
          break;
        case 'process_recent_scenes':
          this.props.onNavigate('/batch', { mode: 'recent', type: 'scenes', days: 7 });
          break;
        case 'process_recent_images':
          this.props.onNavigate('/batch', { mode: 'recent', type: 'images', days: 7 });
          break;
      }
    } catch (error) {
      console.error('Quick action failed:', error);
      alert('Failed to start processing: ' + error.message);
    }
  }

  renderStatusCard(title, status, icon) {
    return (
      <div className="status-card">
        <div className="status-header">
          <span className="status-icon">{icon}</span>
          <span className="status-title">{title}</span>
        </div>
        <div className="status-content">
          <span 
            className="status-indicator"
            style={{ backgroundColor: this.getStatusColor(status) }}
          />
          <span className="status-text">{this.getStatusText(status)}</span>
        </div>
      </div>
    );
  }

  renderQuickActions() {
    const allHealthy = Object.values(this.state.status).every(s => s === 'healthy');

    return (
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button 
            className="action-button"
            onClick={() => this.handleQuickAction('process_untagged_scenes')}
            disabled={!allHealthy}
            title={!allHealthy ? 'All services must be healthy to start processing' : 'Process untagged scenes'}
          >
            <span className="action-icon">🎬</span>
            <span>Process Untagged Scenes</span>
          </button>
          
          <button 
            className="action-button"
            onClick={() => this.handleQuickAction('process_untagged_images')}
            disabled={!allHealthy}
            title={!allHealthy ? 'All services must be healthy to start processing' : 'Process untagged images'}
          >
            <span className="action-icon">🖼️</span>
            <span>Process Untagged Images</span>
          </button>
          
          <button 
            className="action-button"
            onClick={() => this.handleQuickAction('process_recent_scenes')}
            disabled={!allHealthy}
            title={!allHealthy ? 'All services must be healthy to start processing' : 'Process recent scenes'}
          >
            <span className="action-icon">⏱️</span>
            <span>Process Recent Scenes</span>
          </button>
          
          <button 
            className="action-button"
            onClick={() => this.handleQuickAction('process_recent_images')}
            disabled={!allHealthy}
            title={!allHealthy ? 'All services must be healthy to start processing' : 'Process recent images'}
          >
            <span className="action-icon">📅</span>
            <span>Process Recent Images</span>
          </button>
        </div>
      </div>
    );
  }

  renderMetrics() {
    const { metrics } = this.state;

    return (
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🎬</span>
            <span className="metric-title">Scenes</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalScenes}</div>
            <div className="metric-subtext">Total</div>
          </div>
          <div className="metric-details">
            <div className="detail-item">
              <span className="detail-label">Processed:</span>
              <span className="detail-value">{metrics.processedScenes}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pending:</span>
              <span className="detail-value">{metrics.pendingScenes}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-icon">🖼️</span>
            <span className="metric-title">Images</span>
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalImages}</div>
            <div className="metric-subtext">Total</div>
          </div>
          <div className="metric-details">
            <div className="detail-item">
              <span className="detail-label">Processed:</span>
              <span className="detail-value">{metrics.processedImages}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Pending:</span>
              <span className="detail-value">{metrics.pendingImages}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderRecentActivity() {
    const { recentActivity } = this.state;

    return (
      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.length === 0 ? (
            <div className="no-activity">No recent activity</div>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-time">{new Date(activity.timestamp).toLocaleString()}</span>
                <span className="activity-level">{activity.level}</span>
                <span className="activity-message">{activity.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  render() {
    const { loading, error, status } = this.state;

    if (loading) {
      return (
        <div className="dashboard loading">
          <div className="loading-spinner">Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard error">
          <div className="error-message">{error}</div>
        </div>
      );
    }

    const allHealthy = Object.values(status).every(s => s === 'healthy');

    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>NSFWTagger Dashboard</h1>
          <div className="connection-status">
            <span className={`connection-indicator ${allHealthy ? 'healthy' : 'error'}`}>
              {allHealthy ? 'All systems healthy' : 'Some systems have issues'}
            </span>
          </div>
        </div>

        <div className="status-grid">
          {this.renderStatusCard('Plugin', status.plugin, '🏷️')}
          {this.renderStatusCard('Stash', status.stash, '🗄️')}
          {this.renderStatusCard('NSFWTagger', status.container, '🐳')}
          {this.renderStatusCard('LMStudio', status.lmstudio, '🤖')}
        </div>

        {this.renderQuickActions()}
        {this.renderMetrics()}
        {this.renderRecentActivity()}
      </div>
    );
  }
}

// CSS styles (would typically be in a separate CSS file)
const styles = `
  .dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: 24px;
    color: #333;
  }

  .connection-status {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .connection-indicator {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
  }

  .connection-indicator.healthy {
    background-color: #d1fae5;
    color: #065f46;
  }

  .connection-indicator.error {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .status-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .status-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .status-icon {
    font-size: 18px;
  }

  .status-title {
    font-weight: bold;
    color: #374151;
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }

  .status-text {
    font-size: 14px;
    color: #6b7280;
  }

  .quick-actions {
    margin-bottom: 24px;
  }

  .quick-actions h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #374151;
  }

  .action-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .action-button {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
  }

  .action-button:hover:not(:disabled) {
    background: #2563eb;
  }

  .action-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }

  .action-icon {
    font-size: 18px;
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .metric-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .metric-icon {
    font-size: 18px;
  }

  .metric-title {
    font-weight: bold;
    color: #374151;
  }

  .metric-content {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }

  .metric-value {
    font-size: 32px;
    font-weight: bold;
    color: #111827;
  }

  .metric-subtext {
    font-size: 12px;
    color: #6b7280;
  }

  .metric-details {
    border-top: 1px solid #e5e7eb;
    padding-top: 12px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .detail-item:last-child {
    border-bottom: none;
  }

  .detail-label {
    color: #6b7280;
    font-size: 13px;
  }

  .detail-value {
    font-weight: bold;
    color: #111827;
    font-size: 13px;
  }

  .recent-activity {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .recent-activity h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #374151;
  }

  .activity-list {
    max-height: 300px;
    overflow-y: auto;
  }

  .activity-item {
    display: flex;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .activity-item:last-child {
    border-bottom: none;
  }

  .activity-time {
    font-size: 12px;
    color: #6b7280;
    min-width: 140px;
  }

  .activity-level {
    font-size: 12px;
    color: #374151;
    min-width: 60px;
    font-weight: bold;
  }

  .activity-message {
    font-size: 13px;
    color: #374151;
    flex: 1;
  }

  .no-activity {
    font-size: 14px;
    color: #6b7280;
    text-align: center;
    padding: 20px;
  }

  .loading, .error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
  }

  .loading-spinner {
    font-size: 16px;
    color: #6b7280;
  }

  .error-message {
    font-size: 16px;
    color: #ef4444;
    text-align: center;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Dashboard;
