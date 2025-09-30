import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/enhanced-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { authAPI } from '@/lib/api';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, User, Car, Phone, Mail, CreditCard, Hash } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'rider' as 'rider' | 'driver',
    // Driver-specific fields
    license_number: '',
    vehicle_type: '',
    license_plate: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const vehicleTypes = [
    'Hatchback', 'Sedan', 'SUV', 'Premium', 'Electric', 'Motorcycle'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: 'rider' | 'driver') => {
    setFormData(prev => ({ 
      ...prev, 
      role,
      // Reset driver fields when switching to rider
      license_number: role === 'rider' ? '' : prev.license_number,
      vehicle_type: role === 'rider' ? '' : prev.vehicle_type,
      license_plate: role === 'rider' ? '' : prev.license_plate
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return false;
    }

    if (formData.role === 'driver') {
      if (!formData.license_number || !formData.vehicle_type || !formData.license_plate) {
        toast({
          title: "Missing driver information",
          description: "Please fill in all driver-related fields",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const signupData = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        role: formData.role,
        ...(formData.role === 'driver' && {
          license_number: formData.license_number,
          vehicle_type: formData.vehicle_type,
          license_plate: formData.license_plate
        })
      };

      const response = await authAPI.signup(signupData);
      authService.setAuth(response.token, response.user);
      
      toast({
        title: "Account created successfully!",
        description: `Welcome to RideShare, ${response.user.name}!`,
      });

      // Navigate based on role
      if (response.user.role === 'driver') {
        navigate('/driver-dashboard');
      } else {
        navigate('/home');
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-card-border shadow-2xl">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-ride-primary to-ride-secondary rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">RS</span>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Create Account</CardTitle>
          <p className="text-muted-foreground">Join RideShare today</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">I want to</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={formData.role === 'rider' ? 'default' : 'outline'}
                  onClick={() => handleRoleChange('rider')}
                  className="h-16 flex flex-col items-center gap-2"
                >
                  <User className="h-5 w-5" />
                  <span>Book Rides</span>
                </Button>
                <Button
                  type="button"
                  variant={formData.role === 'driver' ? 'default' : 'outline'}
                  onClick={() => handleRoleChange('driver')}
                  className="h-16 flex flex-col items-center gap-2"
                >
                  <Car className="h-5 w-5" />
                  <span>Drive & Earn</span>
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Driver-specific fields */}
            {formData.role === 'driver' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium text-blue-600">Driver Information</Label>
                </div>

                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="license_number"
                      name="license_number"
                      type="text"
                      placeholder="Enter your license number"
                      value={formData.license_number}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <select
                    id="vehicle_type"
                    name="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ride-primary"
                    required
                  >
                    <option value="">Select vehicle type</option>
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="license_plate">License Plate</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="license_plate"
                      name="license_plate"
                      type="text"
                      placeholder="Enter your license plate"
                      value={formData.license_plate}
                      onChange={handleChange}
                      className="pl-10 uppercase"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-ride-primary to-ride-secondary hover:from-ride-primary/90 hover:to-ride-secondary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : `Create ${formData.role} Account`}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-ride-primary hover:text-ride-primary/80 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Role benefits */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              {formData.role === 'rider' ? (
                <>
                  <User className="h-4 w-4 text-green-600" />
                  Rider Benefits
                </>
              ) : (
                <>
                  <Car className="h-4 w-4 text-blue-600" />
                  Driver Benefits
                </>
              )}
            </h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              {formData.role === 'rider' ? (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                    Safe and reliable rides
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                    Real-time tracking
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">✓</Badge>
                    Multiple payment options
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">💰</Badge>
                    Earn money driving
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">📱</Badge>
                    Flexible schedule
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">🚗</Badge>
                    Weekly payments
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
