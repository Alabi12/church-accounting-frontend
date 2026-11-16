// pages/Admin/RolePermissions.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrashIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionMatrix from '../../components/admin/PermissionMatrix';
import toast from 'react-hot-toast';

// Roles that must never be deleted or renamed
const PROTECTED_ROLES = ['super_admin', 'admin'];

const RolePermissions = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [originalRolePermissions, setOriginalRolePermissions] = useState({});

  // Role create/edit state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  // Delete confirmation state
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // FETCH
  // ============================================================
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [rolesData, permissionsData, rolePermsData] = await Promise.all([
        adminService.getRoles().catch((err) => {
          console.error('getRoles failed:', err);
          return [];
        }),
        adminService.getAllPermissions().catch((err) => {
          console.error('getAllPermissions failed:', err);
          return [];
        }),
        adminService.getRolePermissions().catch((err) => {
          console.error('getRolePermissions failed:', err);
          return {};
        }),
      ]);

      // Normalise shapes — some backends return {roles: [...]}, others return [...]
      const rolesList = Array.isArray(rolesData)
        ? rolesData
        : rolesData?.roles || [];
      const permissionsList = Array.isArray(permissionsData)
        ? permissionsData
        : permissionsData?.permissions || [];

      // Normalise rolePermissions into { roleId: { permissionKey: boolean } }
      const normalisedRolePerms = normaliseRolePermissions(
        rolePermsData,
        rolesList
      );

      setRoles(rolesList);
      setPermissions(permissionsList);
      setRolePermissions(normalisedRolePerms);
      setOriginalRolePermissions(JSON.parse(JSON.stringify(normalisedRolePerms)));
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setError(err?.response?.data?.error || err.message || 'Failed to load role permissions');
      toast.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================================
  // HELPERS
  // ============================================================
  /**
   * Normalise rolePermissions from any of these shapes:
   *   { "1": { "view_income": true } }
   *   { "admin": { "view_income": true } }
   *   { roles: [{ id, permissions: ["view_income"] }] }
   */
  function normaliseRolePermissions(raw, rolesList) {
    if (!raw) return {};

    // Already keyed by role id
    if (!Array.isArray(raw) && !raw.roles) {
      const out = {};
      Object.entries(raw).forEach(([roleKey, perms]) => {
        // Find the role by id or name
        const role = rolesList.find(
          (r) => String(r.id) === String(roleKey) || r.name === roleKey
        );
        const key = role ? role.id : roleKey;
        out[key] = Array.isArray(perms)
          ? perms.reduce((acc, p) => ({ ...acc, [normalisePermKey(p)]: true }), {})
          : perms || {};
      });
      return out;
    }

    // Array/object form: { roles: [{ id, permissions: [...] }] }
    const list = Array.isArray(raw) ? raw : raw.roles || [];
    const out = {};
    list.forEach((r) => {
      const perms = r.permissions || r.permission_keys || [];
      out[r.id] = Array.isArray(perms)
        ? perms.reduce((acc, p) => ({ ...acc, [normalisePermKey(p)]: true }), {})
        : perms;
    });
    return out;
  }

  function normalisePermKey(p) {
    if (typeof p === 'string') return p;
    if (p?.key) return p.key;
    if (p?.name) return p.name;
    return String(p);
  }

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(rolePermissions) !== JSON.stringify(originalRolePermissions);
  }, [rolePermissions, originalRolePermissions]);

  const permissionCount = useMemo(() => {
    return permissions.length;
  }, [permissions]);

  // ============================================================
  // PERMISSION TOGGLING
  // ============================================================
  const handlePermissionChange = (roleId, permissionKey, checked) => {
    setRolePermissions((prev) => {
      const existingRolePerms = prev[roleId] || {};
      return {
        ...prev,
        [roleId]: {
          ...existingRolePerms,
          [permissionKey]: checked,
        },
      };
    });
  };

  // ============================================================
  // SAVE PERMISSIONS
  // ============================================================
  const handleSavePermissions = async () => {
    if (!hasUnsavedChanges) {
      toast('No changes to save');
      return;
    }

    try {
      setSaving(true);
      await adminService.updateRolePermissions(rolePermissions);
      setOriginalRolePermissions(JSON.parse(JSON.stringify(rolePermissions)));
      toast.success('Permissions updated successfully');
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error(err.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // ADD / EDIT ROLE
  // ============================================================
  const openAddRoleForm = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setShowRoleForm(true);
  };

  const openEditRoleForm = (role) => {
    setEditingRole(role);
    setRoleName(role.name || '');
    setRoleDescription(role.description || '');
    setShowRoleForm(true);
  };

  const closeRoleForm = () => {
    setShowRoleForm(false);
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
  };

  const handleSaveRole = async () => {
    const trimmedName = roleName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmedName) {
      toast.error('Role name is required');
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(trimmedName)) {
      toast.error('Role name must start with a letter and contain only lowercase letters, numbers, and underscores');
      return;
    }

    try {
      setSaving(true);

      if (editingRole) {
        // Update path — if your adminService doesn't yet have updateRole,
        // this will fall back to throwing and showing an error.
        if (typeof adminService.updateRole === 'function') {
          const updated = await adminService.updateRole(editingRole.id, {
            name: trimmedName,
            description: roleDescription,
          });
          setRoles((prev) =>
            prev.map((r) =>
              r.id === editingRole.id
                ? { ...r, name: trimmedName, description: roleDescription, ...updated }
                : r
            )
          );
          toast.success('Role updated successfully');
        } else {
          toast.error('updateRole is not available on adminService');
          return;
        }
      } else {
        // Create path
        const newRole = await adminService.createRole({
          name: trimmedName,
          description: roleDescription,
        });
        const roleObj = {
          id: newRole?.id ?? `tmp-${Date.now()}`,
          name: newRole?.name ?? trimmedName,
          description: newRole?.description ?? roleDescription,
          userCount: 0,
        };
        setRoles((prev) => [...prev, roleObj]);
        setRolePermissions((prev) => ({ ...prev, [roleObj.id]: {} }));
        setOriginalRolePermissions((prev) => ({ ...prev, [roleObj.id]: {} }));
        toast.success('Role created successfully');
      }

      closeRoleForm();
    } catch (err) {
      console.error('Error saving role:', err);
      toast.error(err.response?.data?.error || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE ROLE
  // ============================================================
  const requestDeleteRole = (role) => {
    if (PROTECTED_ROLES.includes(role.name)) {
      toast.error(`Cannot delete the protected role "${role.name}"`);
      return;
    }
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      setDeleting(true);
      await adminService.deleteRole(roleToDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id));
      setRolePermissions((prev) => {
        const { [roleToDelete.id]: _, ...rest } = prev;
        return rest;
      });
      setOriginalRolePermissions((prev) => {
        const { [roleToDelete.id]: _, ...rest } = prev;
        return rest;
      });
      toast.success(`Role "${roleToDelete.name}" deleted`);
      setRoleToDelete(null);
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(err.response?.data?.error || 'Failed to delete role');
    } finally {
      setDeleting(false);
    }
  };

  // ============================================================
  // RESET
  // ============================================================
  const handleDiscardChanges = () => {
    setRolePermissions(JSON.parse(JSON.stringify(originalRolePermissions)));
    toast('Changes discarded');
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load role permissions
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Permissions</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage user roles and their permissions
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={openAddRoleForm}
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
                Built-in roles (<code>super_admin</code>, <code>admin</code>) are protected and cannot be renamed or deleted.
              </p>
            </div>
          </div>
        </div>

        {/* Unsaved changes banner */}
        <AnimatePresence>
          {hasUnsavedChanges && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  You have unsaved permission changes
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleDiscardChanges}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm text-white bg-[rgb(31,178,86)] rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save now'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Role Cards */}
        {roles.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-8">
            <ShieldCheckIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No roles yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Create your first role to start assigning permissions.
            </p>
            <button
              onClick={openAddRoleForm}
              className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)]"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Role
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {roles.map((role) => {
              const isProtected = PROTECTED_ROLES.includes(role.name);
              const grantedCount = Object.keys(rolePermissions[role.id] || {})
                .filter((p) => rolePermissions[role.id][p]).length;

              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isProtected ? 'bg-amber-100' : 'bg-purple-100'}`}>
                          {isProtected ? (
                            <LockClosedIcon className="h-6 w-6 text-amber-600" />
                          ) : (
                            <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 capitalize truncate">
                            {role.name.replace(/_/g, ' ')}
                          </h3>
                          {role.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button
                          onClick={() => openEditRoleForm(role)}
                          disabled={isProtected}
                          className="p-1.5 text-gray-500 hover:text-[rgb(31,178,86)] hover:bg-gray-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isProtected ? 'Protected role — cannot edit' : 'Edit Role'}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => requestDeleteRole(role)}
                          disabled={isProtected}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                          title={isProtected ? 'Protected role — cannot delete' : 'Delete Role'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Users with this role</span>
                        <span className="font-medium text-gray-900">
                          {role.userCount ?? role.user_count ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Permissions granted</span>
                        <span className="font-medium text-gray-900">
                          {grantedCount}
                          {permissionCount > 0 && (
                            <span className="text-gray-400"> / {permissionCount}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {isProtected && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs text-amber-700">
                        <LockClosedIcon className="h-3 w-3 mr-1" />
                        System-protected role
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Permission Matrix */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Permission Matrix</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Toggle permissions per role, then click Save
              </p>
            </div>
            <div className="flex space-x-2">
              {hasUnsavedChanges && (
                <button
                  onClick={handleDiscardChanges}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Discard
                </button>
              )}
              <button
                onClick={handleSavePermissions}
                disabled={saving || !hasUnsavedChanges}
                className="inline-flex items-center px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-lg hover:bg-[rgb(25,142,69)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-6">
            {roles.length === 0 || permissions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShieldCheckIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  {roles.length === 0
                    ? 'Create a role to start assigning permissions'
                    : 'No permissions available from the server'}
                </p>
              </div>
            ) : (
              <PermissionMatrix
                roles={roles}
                permissions={permissions}
                rolePermissions={rolePermissions}
                onPermissionChange={handlePermissionChange}
              />
            )}
          </div>
        </div>

        {/* Add / Edit Role Modal */}
        <AnimatePresence>
          {showRoleForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4"
              onClick={closeRoleForm}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h2>

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
                      disabled={editingRole && PROTECTED_ROLES.includes(editingRole.name)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgb(31,178,86)] focus:border-[rgb(31,178,86)] disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lowercase letters, numbers, underscores only
                    </p>
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
                    onClick={closeRoleForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={saving}
                    className="px-4 py-2 bg-[rgb(31,178,86)] text-white rounded-md hover:bg-[rgb(25,142,69)] disabled:opacity-50"
                  >
                    {saving
                      ? editingRole ? 'Updating...' : 'Creating...'
                      : editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        {ConfirmDialog && (
          <ConfirmDialog
            isOpen={!!roleToDelete}
            onClose={() => setRoleToDelete(null)}
            onConfirm={confirmDeleteRole}
            title="Delete Role"
            message={
              roleToDelete
                ? `Are you sure you want to delete the role "${roleToDelete.name}"? Users assigned to this role will lose those permissions. This action cannot be undone.`
                : ''
            }
            confirmText={deleting ? 'Deleting...' : 'Delete'}
            cancelText="Cancel"
            type="danger"
            loading={deleting}
          />
        )}
      </div>
    </div>
  );
};

export default RolePermissions;