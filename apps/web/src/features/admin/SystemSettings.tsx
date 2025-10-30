import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { usePermissionStore } from '../../store/permissionStore';
import { SystemSettings, SettingType } from '@issb/types';
import Card, { CardHeader, CardContent, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { TableColumn } from '../../components/ui/Table';
import {
  Settings,
  Database,
  Mail,
  Shield,
  Bell,
  Palette,
  Globe,
  Users,
  Lock,
  Key,
  Server,
  Download,
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter
} from 'lucide-react';

interface SettingFormData {
  key: string;
  value: string;
  type: SettingType;
  description: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  database: 'connected' | 'disconnected';
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  lastBackup: string;
}

interface SecurityAlert {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'system_breach' | 'data_integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

const SystemSettings: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const permissions = usePermissionStore();
  
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [filteredSettings, setFilteredSettings] = useState<SystemSettings[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    uptime: '45d 12h 34m',
    database: 'connected',
    storage: {
      used: 65,
      total: 100,
      percentage: 65
    },
    memory: {
      used: 45,
      total: 100,
      percentage: 45
    },
    lastBackup: '2024-01-15 03:00:00'
  });
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSettings | null>(null);
  const [settingForm, setSettingForm] = useState<SettingFormData>({
    key: '',
    value: '',
    type: SettingType.STRING,
    description: ''
  });
  const [backupForm, setBackupForm] = useState({
    type: 'full',
    includeData: true,
    includeSettings: true
  });
  const [hiddenValues, setHiddenValues] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSettings();
    loadSystemHealth();
    loadSecurityAlerts();
  }, []);

  useEffect(() => {
    filterSettings();
  }, [settings, searchTerm]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockSettings: SystemSettings[] = [
        {
          id: '1',
          key: 'site.name',
          value: 'Professional Association Portal',
          type: SettingType.STRING,
          description: 'The name of the website',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          key: 'site.description',
          value: 'A platform for professionals to connect and collaborate',
          type: SettingType.STRING,
          description: 'Website description',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '3',
          key: 'auth.max_login_attempts',
          value: '5',
          type: SettingType.NUMBER,
          description: 'Maximum login attempts before account lockout',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-10')
        },
        {
          id: '4',
          key: 'auth.session_timeout',
          value: '3600',
          type: SettingType.NUMBER,
          description: 'Session timeout in seconds (default: 1 hour)',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-10')
        },
        {
          id: '5',
          key: 'email.smtp_enabled',
          value: 'true',
          type: SettingType.BOOLEAN,
          description: 'Enable SMTP email sending',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '6',
          key: 'email.smtp_host',
          value: 'smtp.gmail.com',
          type: SettingType.STRING,
          description: 'SMTP server hostname',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '7',
          key: 'email.smtp_port',
          value: '587',
          type: SettingType.NUMBER,
          description: 'SMTP server port',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '8',
          key: 'maintenance_mode',
          value: 'false',
          type: SettingType.BOOLEAN,
          description: 'Enable maintenance mode',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '9',
          key: 'security.enable_2fa',
          value: 'true',
          type: SettingType.BOOLEAN,
          description: 'Enable two-factor authentication',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-08')
        },
        {
          id: '10',
          key: 'backup.auto_backup_enabled',
          value: 'true',
          type: SettingType.BOOLEAN,
          description: 'Enable automatic backups',
          updatedBy: 'admin-1',
          updatedAt: new Date('2024-01-05')
        }
      ];
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    // Mock system health data
    setSystemHealth({
      status: 'healthy',
      uptime: '45d 12h 34m',
      database: 'connected',
      storage: {
        used: 65,
        total: 100,
        percentage: 65
      },
      memory: {
        used: 45,
        total: 100,
        percentage: 45
      },
      lastBackup: '2024-01-15 03:00:00'
    });
  };

  const loadSecurityAlerts = async () => {
    // Mock security alerts
    const mockAlerts: SecurityAlert[] = [
      {
        id: '1',
        type: 'failed_login',
        severity: 'low',
        message: 'Multiple failed login attempts detected for user admin@example.com',
        timestamp: new Date('2024-01-15 10:30:00'),
        resolved: false
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'medium',
        message: 'Unusual access pattern from IP address 192.168.1.100',
        timestamp: new Date('2024-01-15 09:15:00'),
        resolved: true
      },
      {
        id: '3',
        type: 'data_integrity',
        severity: 'high',
        message: 'Database integrity check detected anomalies in user table',
        timestamp: new Date('2024-01-15 08:45:00'),
        resolved: false
      }
    ];
    
    setSecurityAlerts(mockAlerts);
  };

  const filterSettings = () => {
    let filtered = [...settings];
    
    if (searchTerm) {
      filtered = filtered.filter(setting =>
        setting.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredSettings(filtered);
  };

  const handleCreateSetting = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newSetting: SystemSettings = {
        id: String(settings.length + 1),
        ...settingForm,
        value: settingForm.value,
        updatedBy: currentUser?.id || 'unknown',
        updatedAt: new Date()
      };
      
      setSettings([...settings, newSetting]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create setting:', error);
    }
  };

  const handleEditSetting = async () => {
    if (!selectedSetting) return;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedSettings = settings.map(setting =>
        setting.id === selectedSetting.id 
          ? { 
              ...setting, 
              ...settingForm,
              updatedBy: currentUser?.id || 'unknown',
              updatedAt: new Date()
            }
          : setting
      );
      
      setSettings(updatedSettings);
      setShowEditModal(false);
      setSelectedSetting(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleDeleteSetting = async (settingId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedSettings = settings.filter(setting => setting.id !== settingId);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to delete setting:', error);
    }
  };

  const handleBackup = async () => {
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowBackupModal(false);
      setBackupForm({
        type: 'full',
        includeData: true,
        includeSettings: true
      });
      
      // Show success message (you might want to add a toast/notification here)
      alert('Backup completed successfully!');
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  };

  const handleResolveAlert = (alertId: string) => {
    setSecurityAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
  };

  const resetForm = () => {
    setSettingForm({
      key: '',
      value: '',
      type: SettingType.STRING,
      description: ''
    });
  };

  const openEditModal = (setting: SystemSettings) => {
    setSelectedSetting(setting);
    setSettingForm({
      key: setting.key,
      value: setting.value,
      type: setting.type,
      description: setting.description
    });
    setShowEditModal(true);
  };

  const toggleValueVisibility = (settingId: string) => {
    setHiddenValues(prev => {
      const newSet = new Set(prev);
      if (newSet.has(settingId)) {
        newSet.delete(settingId);
      } else {
        newSet.add(settingId);
      }
      return newSet;
    });
  };

  const getSettingValue = (setting: SystemSettings) => {
    const isHidden = hiddenValues.has(setting.id);
    
    if (setting.type === SettingType.BOOLEAN) {
      return setting.value === 'true' ? 'true' : 'false';
    }
    
    if (isHidden && (setting.key.includes('password') || setting.key.includes('secret') || setting.key.includes('token'))) {
      return '••••••••';
    }
    
    return setting.value;
  };

  const getSettingTypeBadge = (type: SettingType) => {
    const styles = {
      [SettingType.STRING]: 'bg-blue-100 text-blue-800',
      [SettingType.NUMBER]: 'bg-green-100 text-green-800',
      [SettingType.BOOLEAN]: 'bg-purple-100 text-purple-800',
      [SettingType.JSON]: 'bg-orange-100 text-orange-800',
      [SettingType.DATE]: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {type}
      </span>
    );
  };

  const getAlertSeverityBadge = (severity: SecurityAlert['severity']) => {
    const styles = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[severity]}`}>
        {severity}
      </span>
    );
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'failed_login':
        return <Users className="w-4 h-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4" />;
      case 'system_breach':
        return <Shield className="w-4 h-4" />;
      case 'data_integrity':
        return <Database className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const settingColumns: TableColumn<SystemSettings>[] = [
    {
      key: 'key',
      title: 'Setting Key',
      dataIndex: 'key',
      render: (key) => (
        <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
          {key}
        </code>
      ),
      width: '200px'
    },
    {
      key: 'value',
      title: 'Value',
      render: (_, setting) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">{getSettingValue(setting)}</span>
          {(setting.key.includes('password') || setting.key.includes('secret') || setting.key.includes('token')) && (
            <Button
              variant="ghost"
              size="sm"
              icon={hiddenValues.has(setting.id) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              onClick={() => toggleValueVisibility(setting.id)}
              className="p-1"
            />
          )}
        </div>
      )
    },
    {
      key: 'type',
      title: 'Type',
      dataIndex: 'type',
      render: getSettingTypeBadge,
      width: '80px'
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      key: 'updatedAt',
      title: 'Last Updated',
      dataIndex: 'updatedAt',
      render: (date) => formatDate(date),
      width: '150px'
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_, setting) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => openEditModal(setting)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => handleDeleteSetting(setting.id)}
            className="text-red-600 hover:text-red-700"
          />
        </div>
      )
    }
  ];

  const hasSystemPermission = permissions.canManageSystem(currentUser!);

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup', icon: <Database className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Server className="w-4 h-4" /> }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide settings and monitor health
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export Settings
          </Button>
          <Button variant="outline" icon={<Upload className="w-4 h-4" />}>
            Import Settings
          </Button>
          {hasSystemPermission && (
            <Button 
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Add Setting
            </Button>
          )}
        </div>
      </div>

      {/* System Health Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              systemHealth.status === 'healthy' ? 'bg-green-100 text-green-800' :
              systemHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                systemHealth.status === 'healthy' ? 'bg-green-500' :
                systemHealth.status === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`} />
              <span className="capitalize">{systemHealth.status}</span>
            </div>
            <span className="text-sm text-gray-500">Uptime: {systemHealth.uptime}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Database</p>
                <p className="text-sm text-gray-600">Connection Status</p>
              </div>
            </div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              systemHealth.database === 'connected' ? 'text-green-600' : 'text-red-600'
            }`}>
              {systemHealth.database === 'connected' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span className="capitalize">{systemHealth.database}</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Storage Usage</span>
              <span className="text-sm text-gray-600">{systemHealth.storage.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${systemHealth.storage.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatBytes(systemHealth.storage.used * 1024 * 1024 * 1024)} / {formatBytes(systemHealth.storage.total * 1024 * 1024 * 1024)}
            </p>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <span className="text-sm text-gray-600">{systemHealth.memory.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${systemHealth.memory.percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {systemHealth.memory.used}GB / {systemHealth.memory.total}GB
            </p>
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search settings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
          
          <Table
            columns={settingColumns}
            data={filteredSettings}
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: true
            }}
          />
        </Card>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Security Alerts</h2>
              <Button
                variant="outline"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={loadSecurityAlerts}
              >
                Refresh
              </Button>
            </div>
            
            <div className="space-y-4">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                  <div className={`p-2 rounded-full ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                    alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{alert.message}</h3>
                      <div className="flex items-center space-x-2">
                        {getAlertSeverityBadge(alert.severity)}
                        {alert.resolved && (
                          <span className="text-xs text-green-600 font-medium">Resolved</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(alert.timestamp)}
                    </p>
                    {!alert.resolved && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveAlert(alert.id)}
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-4">
              {settings.filter(s => s.key.startsWith('auth.') || s.key.startsWith('security.')).map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{setting.description}</h3>
                    <p className="text-sm text-gray-600 font-mono">{setting.key}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm">{getSettingValue(setting)}</span>
                    {hasSystemPermission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => openEditModal(setting)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'email' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Email Configuration</h2>
          <div className="space-y-4">
            {settings.filter(s => s.key.startsWith('email.')).map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{setting.description}</h3>
                  <p className="text-sm text-gray-600 font-mono">{setting.key}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm">{getSettingValue(setting)}</span>
                  {hasSystemPermission && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-4 h-4" />}
                      onClick={() => openEditModal(setting)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'backup' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Backup Management</h2>
              <Button
                icon={<Download className="w-4 h-4" />}
                onClick={() => setShowBackupModal(true)}
              >
                Create Backup
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Last Backup</h3>
                <p className="text-sm text-gray-600">{systemHealth.lastBackup}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Auto Backup</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    settings.find(s => s.key === 'backup.auto_backup_enabled')?.value === 'true'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {settings.find(s => s.key === 'backup.auto_backup_enabled')?.value === 'true' ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup Settings</h2>
            <div className="space-y-4">
              {settings.filter(s => s.key.startsWith('backup.')).map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{setting.description}</h3>
                    <p className="text-sm text-gray-600 font-mono">{setting.key}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-sm">{getSettingValue(setting)}</span>
                    {hasSystemPermission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit className="w-4 h-4" />}
                        onClick={() => openEditModal(setting)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Mode</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-600">
                  Enable to temporarily disable public access to the application
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  settings.find(s => s.key === 'maintenance_mode')?.value === 'true'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {settings.find(s => s.key === 'maintenance_mode')?.value === 'true' ? 'Enabled' : 'Disabled'}
                </span>
                {hasSystemPermission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit className="w-4 h-4" />}
                    onClick={() => openEditModal(settings.find(s => s.key === 'maintenance_mode')!)}
                  >
                    Toggle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Create Setting Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Setting"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setting Key</label>
            <Input
              value={settingForm.key}
              onChange={(e) => setSettingForm({...settingForm, key: e.target.value})}
              placeholder="e.g., site.name or email.smtp_host"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {settingForm.type === SettingType.BOOLEAN ? (
              <select
                value={settingForm.value}
                onChange={(e) => setSettingForm({...settingForm, value: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <Input
                value={settingForm.value}
                onChange={(e) => setSettingForm({...settingForm, value: e.target.value})}
                placeholder="Enter setting value"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={settingForm.type}
              onChange={(e) => setSettingForm({...settingForm, type: e.target.value as SettingType})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={SettingType.STRING}>String</option>
              <option value={SettingType.NUMBER}>Number</option>
              <option value={SettingType.BOOLEAN}>Boolean</option>
              <option value={SettingType.JSON}>JSON</option>
              <option value={SettingType.DATE}>Date</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={settingForm.description}
              onChange={(e) => setSettingForm({...settingForm, description: e.target.value})}
              placeholder="Describe what this setting controls"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSetting}>
              Create Setting
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Setting Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedSetting(null);
          resetForm();
        }}
        title="Edit Setting"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Setting Key</label>
            <Input
              value={settingForm.key}
              onChange={(e) => setSettingForm({...settingForm, key: e.target.value})}
              disabled
              className="bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {settingForm.type === SettingType.BOOLEAN ? (
              <select
                value={settingForm.value}
                onChange={(e) => setSettingForm({...settingForm, value: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            ) : (
              <Input
                value={settingForm.value}
                onChange={(e) => setSettingForm({...settingForm, value: e.target.value})}
                placeholder="Enter setting value"
              />
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={settingForm.type}
              onChange={(e) => setSettingForm({...settingForm, type: e.target.value as SettingType})}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            >
              <option value={SettingType.STRING}>String</option>
              <option value={SettingType.NUMBER}>Number</option>
              <option value={SettingType.BOOLEAN}>Boolean</option>
              <option value={SettingType.JSON}>JSON</option>
              <option value={SettingType.DATE}>Date</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={settingForm.description}
              onChange={(e) => setSettingForm({...settingForm, description: e.target.value})}
              placeholder="Describe what this setting controls"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedSetting(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSetting}>
              Update Setting
            </Button>
          </div>
        </div>
      </Modal>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => {
          setShowBackupModal(false);
          setBackupForm({
            type: 'full',
            includeData: true,
            includeSettings: true
          });
        }}
        title="Create Backup"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Backup Type</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="backupType"
                  value="full"
                  checked={backupForm.type === 'full'}
                  onChange={(e) => setBackupForm({...backupForm, type: e.target.value})}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Full Backup (Database + Files + Settings)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="backupType"
                  value="database"
                  checked={backupForm.type === 'database'}
                  onChange={(e) => setBackupForm({...backupForm, type: e.target.value})}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Database Only</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="backupType"
                  value="settings"
                  checked={backupForm.type === 'settings'}
                  onChange={(e) => setBackupForm({...backupForm, type: e.target.value})}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Settings Only</span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupForm.includeData}
                onChange={(e) => setBackupForm({...backupForm, includeData: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include user data</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupForm.includeSettings}
                onChange={(e) => setBackupForm({...backupForm, includeSettings: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include system settings</span>
            </label>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important Notes</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• Backup creation may take several minutes</li>
                  <li>• The system will be temporarily unavailable during backup</li>
                  <li>• Backup files will be stored securely</li>
                  <li>• You will receive a notification when backup completes</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupModal(false);
                setBackupForm({
                  type: 'full',
                  includeData: true,
                  includeSettings: true
                });
              }}
            >
              Cancel
            </Button>
            <Button
              icon={<Download className="w-4 h-4" />}
              onClick={handleBackup}
            >
              Start Backup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SystemSettings;