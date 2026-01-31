import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  CheckCircle2,
  School,
  GraduationCap,
  Building2,
} from "lucide-react";
import { getSurveyTypeByGrade } from "../../utils/constants";

/**
 * SurveyCompletionCard - Shows on dashboard for first-time users
 * who haven't completed their skill assessment survey yet.
 * Hidden after is_survey_completed is true.
 */
const SurveyCompletionCard = ({ userGrade, userName }) => {
  const navigate = useNavigate();
  const surveyType = getSurveyTypeByGrade(userGrade);

  const surveyInfo = {
    school: {
      title: "Complete Your Learning Profile",
      description:
        "Tell us about your subjects and interests so we can personalize your learning experience.",
      icon: School,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    college: {
      title: "Set Your Career Path",
      description:
        "Choose your learning paths and rate your skills to get personalized course recommendations.",
      icon: GraduationCap,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    professional: {
      title: "Discover Your Skill Gaps",
      description:
        "Select your dream company and role to identify skills you need to develop.",
      icon: Building2,
      color: "from-indigo-500 to-purple-500",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200",
    },
  };

  const info = surveyInfo[surveyType] || surveyInfo.school;
  const IconComponent = info.icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${info.bgColor} ${info.borderColor} border-2 p-6 md:p-8 mb-6`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
        <div
          className={`w-full h-full bg-gradient-to-br ${info.color} rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2`}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
        {/* Left: Icon and Content */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/80 rounded-full text-xs font-bold text-gray-700 border border-gray-200">
                  <Sparkles className="w-3 h-3 text-yellow-500" />
                  Getting Started
                </span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                {info.title}
              </h3>
              <p className="text-gray-600 text-sm md:text-base max-w-md">
                {info.description}
              </p>
            </div>
          </div>

          {/* Benefits list */}
          <div className="mt-4 ml-[4.5rem] flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Personalized recommendations</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Track your progress</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Identify skill gaps</span>
            </div>
          </div>
        </div>

        {/* Right: CTA Button */}
        <div className="md:flex-shrink-0 ml-[4.5rem] md:ml-0">
          <button
            onClick={() => navigate("/analytics/survey")}
            className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r ${info.color} text-white rounded-xl font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
          >
            Start Assessment
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center md:text-right">
            Takes about 3-5 minutes
          </p>
        </div>
      </div>

      {/* Progress indicator dots */}
      <div className="absolute bottom-4 right-4 flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-300" />
        <div className="w-2 h-2 rounded-full bg-gray-400" />
      </div>
    </div>
  );
};

export default SurveyCompletionCard;
