data "aws_iam_policy_document" "ec2_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${var.app_name}-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume_role.json

  tags = { Name = "${var.app_name}-ec2-role" }
}

# Enables SSM Session Manager (browser-based SSH fallback) and CloudWatch agent
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Grants read access to our SSM parameters under /<app_name>/*
data "aws_iam_policy_document" "ssm_read" {
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]
    resources = [
      "arn:aws:ssm:${var.aws_region}:*:parameter/${var.app_name}/*",
    ]
  }

  # Required to decrypt SecureString parameters that use custom KMS keys.
  # The default aws/ssm key works without this, but included for completeness.
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:aws:kms:${var.aws_region}:*:key/*"]
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["ssm.${var.aws_region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "ssm_read" {
  name   = "${var.app_name}-ssm-read"
  policy = data.aws_iam_policy_document.ssm_read.json
}

resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.app.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.app_name}-instance-profile"
  role = aws_iam_role.app.name
}
