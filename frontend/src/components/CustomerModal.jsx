import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MotionButton } from './MotionButton';
import { supabase } from '../lib/supabase';

const defaultFormData = {
  name: '',
  property_id: '',
  email: '',
  phone: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  qb_customer_ref: '',
  status: 'active',
};

export const CustomerModal = ({ isOpen, onClose, onSuccess, createCustomer, editCustomer, customer: editingCustomer, useApiSchema, userId }) => {
  const isEdit = !!editingCustomer;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (isOpen && editingCustomer) {
      setFormData({
        name: editingCustomer.name || '',
        property_id: editingCustomer.property_id || '',
        email: editingCustomer.email || '',
        phone: editingCustomer.phone || '',
        address1: editingCustomer.address1 || '',
        city: editingCustomer.city || '',
        state: editingCustomer.state || '',
        zip: editingCustomer.zip || '',
        qb_customer_ref: editingCustomer.qb_customer_ref || '',
        status: editingCustomer.status || 'active',
      });
    } else if (isOpen && !editingCustomer) {
      setFormData(defaultFormData);
    }
  }, [isOpen, editingCustomer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit && editCustomer) {
        const payload = useApiSchema
          ? { email: formData.email || undefined, phone: formData.phone || undefined, address1: formData.address1, city: formData.city, state: formData.state, zip: formData.zip, qb_customer_ref: formData.qb_customer_ref }
          : { email: formData.email || null, phone: formData.phone || null, address1: formData.address1 || null, city: formData.city || null, state: formData.state || null, zip: formData.zip || null, qb_customer_ref: formData.qb_customer_ref || null, status: formData.status };
        await editCustomer(editingCustomer.id, payload);
      } else if (createCustomer && useApiSchema) {
        await createCustomer({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address1: formData.address1 || undefined,
          city: formData.city || undefined,
          state: formData.state || undefined,
          zip: formData.zip || undefined,
          qb_customer_ref: formData.qb_customer_ref || undefined,
        });
      } else {
        const row = {
          name: formData.name,
          property_id: formData.property_id || null,
          email: formData.email || null,
          phone: formData.phone || null,
          address1: formData.address1 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip: formData.zip || null,
          qb_customer_ref: formData.qb_customer_ref || null,
          status: formData.status,
        };
        if (userId) row.user_id = userId;
        const { error } = await supabase.from('customers').insert([row]);
        if (error) throw error;
      }

      onSuccess?.();
      onClose();
      setFormData(defaultFormData);
    } catch (err) {
      console.error(isEdit ? 'Error updating customer:' : 'Error adding customer:', err);
      alert(err.message || (isEdit ? 'Failed to update customer.' : 'Failed to add customer. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-xl font-semibold text-slate-900">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h2>
                <button
                  onClick={onClose}
                  data-testid="close-modal-btn"
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    data-testid="customer-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="bg-white/50"
                    disabled={isEdit}
                  />
                </div>

                {!useApiSchema && (
                  <div className="space-y-2">
                    <Label htmlFor="property_id">Property ID</Label>
                    <Input
                      id="property_id"
                      data-testid="customer-property-id-input"
                      value={formData.property_id}
                      onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                      placeholder="PROP-12345"
                      className="bg-white/50"
                      disabled={isEdit}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    data-testid="customer-email-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="bg-white/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    data-testid="customer-phone-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="bg-white/50"
                  />
                </div>

                {useApiSchema && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="address1">Address</Label>
                      <Input
                        id="address1"
                        value={formData.address1}
                        onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                        placeholder="123 Main St"
                        className="bg-white/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-white/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="TX"
                          className="bg-white/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        className="bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qb_customer_ref">QuickBooks Customer Ref</Label>
                      <Input
                        id="qb_customer_ref"
                        value={formData.qb_customer_ref}
                        onChange={(e) => setFormData({ ...formData, qb_customer_ref: e.target.value })}
                        className="bg-white/50"
                      />
                    </div>
                  </>
                )}

                {!useApiSchema && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger data-testid="customer-status-select" className="bg-white/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <MotionButton
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    data-testid="cancel-customer-btn"
                  >
                    Cancel
                  </MotionButton>
                  <MotionButton
                    type="submit"
                    disabled={loading || !formData.name}
                    className="flex-1"
                    data-testid="submit-customer-btn"
                  >
                    {loading ? (isEdit ? 'Saving...' : 'Adding...') : (isEdit ? 'Save changes' : 'Add Customer')}
                  </MotionButton>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
