import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Input, 
  TextArea, 
  Select, 
  Checkbox, 
  RadioGroup,
  type SelectOption,
  type RadioOption 
} from './index';
import { User, Mail, Phone, Lock, CheckCircle, AlertTriangle } from 'lucide-react';

// Validation schema
const formSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  department: z.string().min(1, 'Please select a department'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  role: z.string().min(1, 'Please select your role'),
  salary: z.string().min(1, 'Please select salary range'),
});

type FormData = z.infer<typeof formSchema>;

const InputComponentsDemo: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      bio: '',
      department: '',
      terms: false,
      role: '',
      salary: '',
    },
  });

  const watchedRole = watch('role');

  // Sample options for Select component
  const departmentOptions: SelectOption[] = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' },
  ];

  // Sample options for RadioGroup component
  const roleOptions: RadioOption[] = [
    { 
      value: 'intern', 
      label: 'Intern', 
      description: 'Student or recent graduate seeking experience',
      icon: <User size={16} />
    },
    { 
      value: 'junior', 
      label: 'Junior Developer', 
      description: '0-2 years of professional experience',
      icon: <User size={16} />
    },
    { 
      value: 'senior', 
      label: 'Senior Developer', 
      description: '3+ years of professional experience',
      icon: <User size={16} />
    },
    { 
      value: 'lead', 
      label: 'Team Lead', 
      description: 'Lead a team of developers',
      icon: <User size={16} />
    },
  ];

  const salaryOptions: RadioOption[] = [
    { value: '40-60k', label: '$40,000 - $60,000' },
    { value: '60-80k', label: '$60,000 - $80,000' },
    { value: '80-100k', label: '$80,000 - $100,000' },
    { value: '100k+', label: '$100,000+' },
  ];

  const onSubmit = async (data: FormData) => {
    console.log('Form submitted:', data);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Form submitted successfully!');
    reset();
  };

  const watchedEmail = watch('email');
  const watchedDepartment = watch('department');

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Components Demo</h1>
        <p className="text-gray-600">
          Comprehensive form components with validation, error handling, and accessibility features
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('firstName')}
            label="First Name"
            placeholder="John"
            error={errors.firstName?.message}
            leftIcon={<User size={18} />}
            required
            success={!!watchedEmail && !errors.firstName}
          />
          
          <Input
            {...register('lastName')}
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
            required
            success={!!watchedEmail && !errors.lastName}
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            {...register('email')}
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            error={errors.email?.message}
            leftIcon={<Mail size={18} />}
            rightIcon={watchedEmail && !errors.email ? <CheckCircle size={18} className="text-success-500" /> : null}
            required
            helperText="We'll never share your email with anyone else"
          />
          
          <Input
            {...register('phone')}
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            error={errors.phone?.message}
            leftIcon={<Phone size={18} />}
            required
          />
        </div>

        {/* Bio - TextArea Component */}
        <TextArea
          {...register('bio')}
          label="Biography"
          placeholder="Tell us about yourself..."
          error={errors.bio?.message}
          helperText={`${watch('bio')?.length || 0}/500 characters`}
          rows={4}
          resize="vertical"
        />

        {/* Select Component */}
        <Select
          {...register('department')}
          label="Department"
          options={departmentOptions}
          error={errors.department?.message}
          placeholder="Choose your department..."
          leftIcon={<User size={18} />}
          required
          searchable
          clearable
        />

        {/* RadioGroup Component - Role */}
        <RadioGroup
          name="role"
          value={watchedRole}
          onChange={(value) => setValue('role', value)}
          label="Select Your Role"
          description="Choose the role that best describes your experience level"
          options={roleOptions}
          error={errors.role?.message}
          required
          direction="vertical"
        />

        {/* RadioGroup Component - Salary */}
        <RadioGroup
          name="salary"
          value={watch('salary')}
          onChange={(value) => setValue('salary', value)}
          label="Expected Salary Range"
          options={salaryOptions}
          error={errors.salary?.message}
          required
          direction="horizontal"
        />

        {/* Checkbox Component */}
        <div className="space-y-3">
          <Checkbox
            {...register('terms')}
            label="I accept the Terms of Service and Privacy Policy"
            description="By checking this box, you agree to our terms and conditions"
            error={errors.terms?.message}
            required
            leftIcon={<Lock size={16} />}
          />
        </div>

        {/* Example of different variants */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Variants</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Filled Variant"
              placeholder="This is a filled input"
              variant="filled"
              helperText="This input has a filled background"
            />
            
            <Input
              label="Ghost Variant"
              placeholder="This is a ghost input"
              variant="ghost"
              helperText="This input has a transparent background"
            />
            
            <Select
              label="Loading State"
              options={departmentOptions}
              placeholder="Options will be loaded..."
              isLoading
              disabled
            />
          </div>
        </div>

        {/* Example of validation states */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation States</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Success State"
              placeholder="This shows success state"
              success
              helperText="This field has a valid value"
            />
            
            <Input
              label="Warning State"
              placeholder="This shows warning state"
              warning
              helperText="Please review this field"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              'Submit Form'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Additional Examples */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Examples</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Password Input with Toggle</h4>
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              showPasswordToggle
              leftIcon={<Lock size={18} />}
              required
            />
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Multiple Checkbox Example</h4>
            <div className="space-y-2">
              <Checkbox
                label="Frontend Development"
                description="React, Vue, Angular"
              />
              <Checkbox
                label="Backend Development"
                description="Node.js, Python, Java"
                indeterminate
              />
              <Checkbox
                label="Mobile Development"
                description="React Native, Flutter"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputComponentsDemo;