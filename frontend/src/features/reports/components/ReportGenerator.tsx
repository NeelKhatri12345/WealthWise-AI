import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const reportSchema = z.object({
  type: z.enum(["monthly", "quarterly", "annual", "custom"]),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().min(1, "End date is required"),
  includeCharts: z.boolean().optional(),
  includeSummary: z.boolean().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface ReportGeneratorProps {
  onGenerate: (data: ReportFormValues) => void;
  isLoading?: boolean;
}

export const ReportGenerator = ({
  onGenerate,
  isLoading = false,
}: ReportGeneratorProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { includeCharts: true, includeSummary: true },
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Generate Report
      </h3>

      <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            {...register("type")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="monthly">Monthly Report</option>
            <option value="quarterly">Quarterly Report</option>
            <option value="annual">Annual Report</option>
            <option value="custom">Custom Range</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              {...register("dateFrom")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.dateFrom && (
              <p className="mt-1 text-xs text-red-600">
                {errors.dateFrom.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              {...register("dateTo")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            {errors.dateTo && (
              <p className="mt-1 text-xs text-red-600">
                {errors.dateTo.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("includeCharts")}
              className="rounded text-indigo-600"
            />
            Include Charts
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("includeSummary")}
              className="rounded text-indigo-600"
            />
            Include Summary
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </form>
    </div>
  );
};
