import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  LockClosedIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionMatrix from '../../components/admin/PermissionMatrix';
import toast from 'react-hot-toast';

const RolePermissions = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [editingRole, setEditingRole] = useState(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, rolePermsData] = await Promise.all([
        adminService.getRoles(),
        adminService.getAllPermissions(),
        adminService.getRolePermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setRolePermissions(rolePermsData);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (roleId, permission, checked) => {
    setRolePermissions(prev => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permission]: checked,
      },
    }));
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      await adminService.updateRolePermissions(rolePermissions);
      toast.success('Permissions updated successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error(error.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setSaving(true);
      const newRole = await adminService.createRole({
        name: roleName,
        description: roleDescription,
      });
      setRoles([...roles, newRole]);
      setRolePermissions({
        ...rolePermissions,
        [newRole.id]: {},
      });
      setShowRoleForm(false);
      setRoleName('');
      setRoleDescription('');
      toast.success('Role created successfully');
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error(error.response?.data?.error || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    try {
      await adminService.deleteRole(roleId);
      setRoles(roles.filter(r => r.id !== roleId));
      const { [roleId]: _, ...rest } = rolePermissions;
      setRolePermissions(rest);
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(error.response?.data?.error || 'Failed to delete role');
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage user roles and their permissions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setShowRoleForm(true)}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Add Role
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mb-6">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">About Role Permissions</h4>
              <p className="text-xs text-blue-600 mt-1">
                Configure which permissions each role has. Changes will affect all users with that role.
                Be careful when modifying permissions for built-in roles.
              </p>
            </div>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {role.name.replace('_', ' ')}
                      </h3>
                      {role.description && (
                        <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                      )}
                    </div>
                  </div>
                  {role.name !== 'super_admin' && role.name !== 'admin' && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Role"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Users with this role</span>
                    <span className="font-medium text-gray-900">{role.userCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Permissions granted</span>
                    <span className="font-medium text-gray-900">
                      {Object.keys(rolePermissions[role.id] || {}).filter(p => rolePermissions[role.id][p]).length}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Permission Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Permission Matrix</h2>
            <button
              onClick={handleSavePermissions}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
          <div className="p-6">
            <PermissionMatrix
              roles={roles}
              permissions={permissions}
              rolePermissions={rolePermissions}
              onPermissionChange={handlePermissionChange}
            />
          </div>
        </div>

        {/* Add Role Modal */}
        {showRoleForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., manager, coordinator"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the role's purpose..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)]"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRoleForm(false);
                    setRoleName('');
                    setRoleDescription('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRole}
                  disabled={saving}
                  className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)] disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RolePermissions;