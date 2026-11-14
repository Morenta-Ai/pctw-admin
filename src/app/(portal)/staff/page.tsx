import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { roleLabels } from "@/core/auth/roles";
import { requireRole } from "@/core/auth/session";
import { formatRelative } from "@/core/format/format";
import { unwrap } from "@/core/result";
import { InviteStaffDialog } from "@/features/staff/components/invite-staff-dialog";
import { StaffRowActions } from "@/features/staff/components/staff-row-actions";
import { getStaffRepository } from "@/features/staff/data/staff-repository";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const me = await requireRole("admin");
  const staff = unwrap(await getStaffRepository().list());
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Staff"
        description="Admin and call-centre accounts for this portal. You can't change your own role or status: ask another admin."
        actions={<InviteStaffDialog />}
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last signed in</TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <span className="block font-semibold">
                      {member.name}
                      {member.id === me.id && (
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          (you)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {member.email}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      tone={member.role === "admin" ? "navy" : "cyan"}
                    >
                      {roleLabels[member.role]}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    <StatusPill
                      tone={member.status === "active" ? "success" : "danger"}
                    >
                      {member.status === "active" ? "Active" : "Suspended"}
                    </StatusPill>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.lastSignInAt
                      ? formatRelative(member.lastSignInAt, now)
                      : "Invited, not yet signed in"}
                  </TableCell>
                  <TableCell>
                    {member.id !== me.id && <StaffRowActions member={member} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
