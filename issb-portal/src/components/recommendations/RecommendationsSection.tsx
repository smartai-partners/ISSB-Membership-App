import React from 'react';
import { useGetRecommendationsQuery, type Recommendation } from '@/store/api/membershipApi';
import { Link } from 'react-router-dom';
import {
  HandHeart,
  Calendar,
  DollarSign,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

const RecommendationsSection: React.FC = () => {
  const { data, isLoading, error } = useGetRecommendationsQuery();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </div>
      </div>
    );
  }

  if (error || !data || data.recommendations.length === 0) {
    return null; // Don't show anything if there are no recommendations
  }

  const getIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'volunteer':
        return <HandHeart className="w-6 h-6 text-emerald-600" />;
      case 'event':
        return <Calendar className="w-6 h-6 text-blue-600" />;
      case 'payment':
        return <DollarSign className="w-6 h-6 text-amber-600" />;
      case 'member':
        return <Users className="w-6 h-6 text-purple-600" />;
      case 'role':
        return <Award className="w-6 h-6 text-indigo-600" />;
      default:
        return <Sparkles className="w-6 h-6 text-gray-600" />;
    }
  };

  const getCardStyle = (type: Recommendation['type']) => {
    switch (type) {
      case 'volunteer':
        return 'border-l-4 border-emerald-500 hover:bg-emerald-50';
      case 'event':
        return 'border-l-4 border-blue-500 hover:bg-blue-50';
      case 'payment':
        return 'border-l-4 border-amber-500 hover:bg-amber-50';
      case 'member':
        return 'border-l-4 border-purple-500 hover:bg-purple-50';
      case 'role':
        return 'border-l-4 border-indigo-500 hover:bg-indigo-50';
      default:
        return 'border-l-4 border-gray-500 hover:bg-gray-50';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border border-green-100">
      <div className="flex items-center mb-4">
        <Sparkles className="w-6 h-6 text-green-600 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">You Might Be Interested In</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Personalized suggestions to help you get the most out of your ISSB membership
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {data.recommendations.map((recommendation) => (
          <Link
            key={recommendation.id}
            to={recommendation.actionUrl}
            className={`bg-white rounded-lg p-4 transition-all duration-200 ${getCardStyle(
              recommendation.type
            )} group`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                {getIcon(recommendation.type)}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {recommendation.description}
                </p>
                <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                  <span>{recommendation.actionText}</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {data.total > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Recommendations updated {new Date(data.generated_at).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsSection;
